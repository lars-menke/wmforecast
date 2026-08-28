# WMForecast — Modell-Logik (vollständige Dokumentation)

Diese Datei beschreibt **ausschließlich die Prognose-/Modelllogik** der
WMForecast-App (Stand v3.3.0, WM 2026 final), losgelöst von UI und
Turnierstruktur. Ziel: 1:1 verständliche Grundlage, um dieselbe Logik in
einer Bundesliga-Prognose-App nachzubauen. Am Ende steht ein eigener
Abschnitt, der beschreibt, was sich beim Wechsel Turnier → Ligabetrieb
ändern muss.

Quellcode-Referenzen (im Original-Repo `wmforecast`, Stand `main`):
`src/lib/poisson.ts`, `src/lib/calibration.ts`, `src/lib/simulation.ts`,
`src/lib/betRadar.ts`, `src/lib/learnLog.ts`, `src/lib/modelConfig.ts`,
`scripts/train-from-statsbomb.mjs`, `docs/calibration-analysis.md`.

---

## 1. Der Gesamtfluss auf einen Blick

Für jedes Einzelspiel läuft die Prognose durch fünf Schichten,
nacheinander, jede auf dem Ergebnis der vorherigen:

```
Schicht 1  Teamstärken (Angriff/Abwehr pro Team, statisch trainiert)
    ↓
Schicht 2  Poisson-Basis-Lambda (erwartete Tore je Team, aus Schicht 1)
    ↓
Schicht 3  Marktkorrektur (Newton-Raphson zieht Lambda Richtung Buchmacherquote)
    ↓
Schicht 4  50/50-Blend (Basis-Lambda und marktkorrigiertes Lambda gemittelt)
    ↓
Schicht 5  Kalibrierung (Platt-Scaling, korrigiert 1X2-Wahrscheinlichkeiten)
    ↓
        1X2-Wahrscheinlichkeiten + Ergebnis-Tipp (z.B. "2:1")
```

Zusätzlich existiert eine **von Schicht 2 getrennte** Turnier-Simulation
(Monte-Carlo über viele simulierte Turnierverläufe), die dieselbe
Basis-Lambda-Logik wiederverwendet, aber Tausende Zufalls-Turniere
durchspielt, um Titel-/Aufstiegs-/Endrundenwahrscheinlichkeiten zu
schätzen. Die beiden Wege sind seit v3.0.0 auf **ein gemeinsames Modell**
vereinheitlicht (siehe Abschnitt 6).

---

## 2. Schicht 1: Teamstärken — wie mit historischen Daten umgegangen wurde

### 2.1 Die Grundgröße: Angriff und Abwehr pro Team

Jedes Team bekommt vier Zahlen (`TeamStats`):

```ts
type TeamStats = {
  rank: number;   // nur informativ, fließt nicht in die Rechnung ein
  hGF: number;    // Tore erzielt (Heim)
  hGA: number;    // Tore kassiert (Heim)
  aGF: number;    // Tore erzielt (Auswärts)
  aGA: number;    // Tore kassiert (Auswärts)
};
```

Bei der WM (neutraler Boden, kein Heimvorteil) wurden `hGF`/`aGF` und
`hGA`/`aGA` bewusst **identisch** befüllt — die App unterscheidet intern
zwischen Heim/Auswärts, aber das Turnier kennt diesen Unterschied nicht.
**Für die Bundesliga muss das aufgehoben werden** — siehe Abschnitt 7.

### 2.2 Woher die Zahlen kommen: IPF-Training auf Länderspieldaten

Die Werte wurden **nicht geschätzt**, sondern mit einem eigenen
Trainingsskript (`scripts/train-from-statsbomb.mjs`) aus echten
historischen Ergebnissen berechnet. Ablauf:

1. **Datenquelle:** Alle internationalen Länderspiele ab 2018 aus dem
   öffentlichen Datensatz `martj42/international_results` (CSV, via
   GitHub). Für jedes Spiel: Heimteam, Auswärtsteam, Endstand, Turnierart,
   Datum.

2. **Gewichtung nach Turnierart** (ein Spiel zählt nicht überall gleich):

   | Turnierart | Gewicht |
   |---|---|
   | Weltmeisterschaft | 3,0 |
   | Kontinental (EM, Copa América, Afrika-/Asien-Cup, Gold Cup) | 1,5 |
   | Nations League | 1,2 |
   | Qualifikation | 1,0 |
   | Freundschaftsspiel | 0,5 |

3. **Zeitgewichtung (Decay):** Exponentieller Abfall mit **Halbwertszeit
   730 Tage (2 Jahre)** — ein Spiel von vor 2 Jahren zählt nur noch halb
   so viel wie ein aktuelles:
   ```
   weight_time = exp( -ln(2) / 730 * Tage_seit_Spiel )
   weight_final = weight_turnier * weight_time
   ```

4. **IPF (Iterative Proportional Fitting)** — das eigentliche
   Kernverfahren, um aus paarweisen Ergebnissen konsistente
   Angriffs-/Abwehrwerte pro Team zu extrahieren. 100 Iterationen,
   abwechselnd:
   - **Angriffs-Update:** Für jedes Team `t`: Summe der (gewichteten,
     erzielten) Tore geteilt durch Summe der (gewichteten) Abwehrstärken
     der Gegner.
     ```
     attack[t] = Σ(weight · erzielte Tore) / Σ(weight · defense[Gegner])
     ```
   - **Normierung:** Geometrisches Mittel aller `attack[t]`-Werte auf 1
     ziehen (sonst driftet die Skala im Trainingsloop weg).
   - **Abwehr-Update:** Analog mit kassierten Toren und
     Gegner-Angriffsstärken, ebenfalls separat auf 1 normiert.
   - Nach 100 Wiederholungen konvergiert das System auf konsistente
     Werte: Ein Team mit hohem `attack` erzielt gegen einen
     Durchschnittsgegner überdurchschnittlich viele Tore, unabhängig
     davon, gegen wen es tatsächlich gespielt hat.

5. **Skalierung:** `hGF = attack[team] * 1,3`, `hGA = defense[team]`
   (der Faktor 1,3 kalibriert das mittlere Lambda auf ein realistisches
   Tore-Niveau; wurde empirisch mit der Kalibrierungsschicht abgestimmt).

**Ergebnis:** Eine `NATION_STATS`-Tabelle mit einer Zeile pro Team, rein
aus historischen Ergebnissen abgeleitet — keine manuellen Einschätzungen.

---

## 3. Schicht 2: Poisson-Modell — wie aus Teamstärken ein Ergebnis wird

### 3.1 Erwartete Tore (Lambda)

Für ein Spiel Heim gegen Auswärts:

```ts
hAtt = (hStats.hGF + hStats.aGF) / 2   // Angriffsstärke Heimteam
hDef = (hStats.hGA + hStats.aGA) / 2   // Abwehrstärke Heimteam
aAtt = (aStats.hGF + aStats.aGF) / 2   // Angriffsstärke Auswärtsteam
aDef = (aStats.hGA + aStats.aGA) / 2   // Abwehrstärke Auswärtsteam

λ_Heim      = hAtt * aDef   // Angriff Heim trifft auf Abwehr Auswärts
λ_Auswärts  = aAtt * hDef
```

Beide Werte werden auf **[0,3 ; 4,5]** Tore geclippt (Modell-Konstanten
`LAMBDA_MIN`/`LAMBDA_MAX`) — verhindert absurde Extremwerte bei sehr
unausgeglichenen Paarungen.

*(Bei der WM wurde `hGF == aGF` und `hGA == aGA` gesetzt — dadurch fällt
der Heim-/Auswärtsunterschied faktisch weg = "neutraler Boden". Das ist
der Punkt, der in der Liga rückgängig gemacht werden muss.)*

### 3.2 Von Lambda zur Tormatrix: Poisson-Verteilung

Für jedes mögliche Ergebnis `i:j` (0 bis 7 Tore je Team) wird die
Wahrscheinlichkeit über die **Poisson-Verteilung** berechnet:

```
P(k Tore | λ) = e^(-λ) · λ^k / k!
```

Das Modell nimmt an: Die Anzahl der Tore eines Teams in einem Spiel folgt
(näherungsweise) einer Poisson-Verteilung mit Erwartungswert λ. Die
gemeinsame Wahrscheinlichkeit für ein Ergebnis `i:j` ist dann (unter
Unabhängigkeitsannahme):

```
P(i:j) = P(i Tore | λ_Heim) * P(j Tore | λ_Auswärts)
```

### 3.3 Dixon-Coles-Korrektur

Die reine Unabhängigkeitsannahme unterschätzt/überschätzt bestimmte
niedrige Ergebnisse systematisch (bekanntes Problem des reinen
Poisson-Modells im Fußball). Korrektur mit **ρ (rho) = −0,13**:

```
τ(0,0) = 1 − λ_Heim · λ_Auswärts · ρ
τ(0,1) = 1 + λ_Heim · ρ
τ(1,0) = 1 + λ_Auswärts · ρ
τ(1,1) = 1 − ρ
τ(alle anderen) = 1
```

Die finale Zellenwahrscheinlichkeit der Tormatrix ist
`P(i:j) * τ(i,j)`. Der Effekt: 0:0 und 1:1 werden leicht wahrscheinlicher,
1:0 und 0:1 leicht unwahrscheinlicher, gegenüber reinem Poisson — das
entspricht der empirisch beobachteten leichten Korrelation zwischen den
beiden Team-Torzahlen bei knappen Ergebnissen.

### 3.4 1X2 aus der Tormatrix

Die 8×8-Matrix (0–7 Tore je Team) wird aufsummiert:

```
P(Heimsieg) = Σ P(i:j) für i > j
P(Remis)    = Σ P(i:j) für i = j
P(Auswärtssieg) = Σ P(i:j) für i < j
```

Anschließend auf Summe 1 normiert (Rundungsfehler durch die begrenzte
Matrixgröße 0–7 statt 0–∞).

---

## 4. Schicht 3+4: Wie der Wettmarkt eingearbeitet wird

### 4.1 Newton-Raphson-Marktkorrektur

Wenn Buchmacherquoten für ein Spiel vorliegen (als implizite
Wahrscheinlichkeiten `market.h`, `market.d`, `market.a` in Prozent),
werden die Basis-Lambdas iterativ so verändert, dass die daraus
resultierenden Modellwahrscheinlichkeiten den Marktquoten entsprechen:

1. Zwei Multiplikatoren `xH = xA = 1,0` starten.
2. In jeder der 12 Iterationen: Tormatrix mit `λ_Heim·xH`, `λ_Auswärts·xA`
   berechnen, Differenz zu Marktquote (`f1`, `f2`) bestimmen.
3. Numerischer Jacobian (Ableitung der Wahrscheinlichkeiten nach `xH`,
   `xA`) über eine kleine Störung `ε = 0,0001`.
4. Newton-Raphson-Schritt mit Dämpfung `damp = 0,5` (halbe Schrittweite
   pro Iteration — verhindert Überschwingen):
   ```
   xH += damp · (−f1·J22 + f2·J12) / det(J)
   xA += damp · ( f1·J21 − f2·J11) / det(J)
   ```
5. Multiplikatoren werden auf `[0,4 ; 2,5]` geclippt.
6. Degenerierte Marktdaten (eine Quote unter 2 % oder Summe H+A über 98 %)
   werden ignoriert — das Modell bleibt dann unverändert.

Ergebnis: `λ_Heim_markt = λ_Heim · xH`, `λ_Auswärts_markt = λ_Auswärts · xA`
— ein Lambda-Paar, dessen Poisson-Wahrscheinlichkeiten (näherungsweise)
exakt der Marktquote entsprechen.

### 4.2 50/50-Blend (der validierte Kernparameter)

Statt den Markt vollständig zu übernehmen, wird linear mit dem
Modell-Lambda gemittelt:

```
MARKET_BLEND = 0,5   // 0 = nur Modell, 1 = nur Markt

λ_Heim_final     = λ_Heim     · (1 − MARKET_BLEND) + λ_Heim_markt     · MARKET_BLEND
λ_Auswärts_final = λ_Auswärts · (1 − MARKET_BLEND) + λ_Auswärts_markt · MARKET_BLEND
```

**Warum genau 0,5:** Das wurde nicht angenommen, sondern **empirisch am
Lernprotokoll validiert** (siehe Abschnitt 8). Über das gesamte
WM-Turnier (53 Spiele) lag α=0,5 im Log-Loss nur 0,0024 hinter dem
rechnerischen Optimum (α≈0,22–0,3) und war gleichzeitig das
**Trefferquoten-Optimum** (75,5 %). Wichtigste Erkenntnis: **Die
50/50-Mischung schlägt sowohl das reine Modell als auch den reinen
Markt** — ein Ensemble-Effekt, kein Kompromiss.

**Wichtige Einschränkung, die dieser Mechanismus hat:** Die Mittelung ist
eine reine lineare Durchschnittsbildung im Lambda-Raum. Sie berücksichtigt
nicht, *wie stark* Modell und Markt sich uneinig sind — bei einem Spiel
mit sehr starkem Markt-Übergewicht kann der Blend der Marktrichtung
folgen, obwohl die historische Bilanz bei genau solchen Uneinigkeiten
eher fürs Modell sprach (siehe Abschnitt 8.3, „Dissens-Signal" — ein
konkreter Verbesserungsvorschlag für die BL-App).

---

## 5. Schicht 5: Kalibrierung (Platt-Scaling)

### 5.1 Warum Kalibrierung nötig ist

Die Poisson+Dixon-Coles-Wahrscheinlichkeiten sind theoretisch fundiert,
aber nicht zwangsläufig "gut kalibriert" (d.h., wenn das Modell 70 %
sagt, gewinnt das Team nicht zwangsläufig in 70 % der Fälle). Platt-
Scaling korrigiert das nachträglich, pro Ausgangsklasse (H/D/A) getrennt.

### 5.2 Die Transformation

```
logit(p) = ln( p / (1−p) )        // Wahrscheinlichkeit → reelle Zahl
sigmoid(x) = 1 / (1 + e^(−x))     // reelle Zahl → Wahrscheinlichkeit

corrected_H = sigmoid( aH · logit(pH) + bH )
corrected_D = sigmoid( aD · logit(pD) + bD )
corrected_A = sigmoid( aA · logit(pA) + bA )

// Renormierung auf Summe 1:
pH_final = corrected_H / (corrected_H + corrected_D + corrected_A)
... analog für D, A
```

Sechs Parameter (`aH, bH, aD, bD, aA, bA`) — je ein Steigungs- und
Verschiebungsparameter pro Ausgangsklasse.

### 5.3 Trainierte Startwerte (Prior)

Aus den StatsBomb-Daten der WM 2018 + WM 2022 (nur Gruppenphase, 96
Spiele), per Gradient-Descent auf Log-Loss (200 Iterationen, Lernrate
0,02) trainiert:

```
aH = 1,024   bH = -0,086
aD = 0,975   bD =  0,010
aA = 0,998   bA =  0,062
n  = 96
```

Die Werte liegen nahe bei `a=1, b=0` (= Identität) — ein Hinweis, dass
das rohe Poisson-Modell auf WM-Daten bereits ordentlich kalibriert war
und die Korrektur nur eine Feinjustierung leistet.

### 5.4 Live-Update während des Turniers

Mit jedem beendeten Spiel wird der Prior per Gradient-Descent (40
Iterationen, Lernrate 0,05) auf die tatsächlichen Live-Ergebnisse
nachjustiert — mit **L2-Regularisierung**, die die Parameter zum Prior
zurückzieht:

```
regW = n_live / n_prior          // Stärke der Regularisierung
a -= lr · ( Gradient/n_live + regW · (a - a_prior) )
```

Solange `n_live << n_prior` (96), dominiert der Prior — die Kalibrierung
"driftet" also nicht auf einer kleinen Stichprobe weg, sondern nähert
sich erst mit wachsendem `n_live` stärker den echten Turnierdaten an.

**Sicherheitsschwelle:** Erst ab **mindestens 45 abgeschlossenen
Spielen** wird überhaupt kalibriert (`calib.n >= 45`). Davor greift ein
simplerer Fallback: **Shrinkage zum Gleichverteilungs-Prior** —
```
p_final = 0,88 · p_modell + 0,12 · (1/3)
```
— zieht die Wahrscheinlichkeiten leicht Richtung Gleichverteilung, um
Overconfidence bei kleiner Stichprobe zu dämpfen.

---

## 6. Die Turnier-Simulation (Monte-Carlo)

Getrennt von der Einzelspiel-Prognose existiert eine zweite Anwendung
derselben Grundlogik: die Simulation kompletter Turnierverläufe, um
Wahrscheinlichkeiten für Titel, Halbfinaleinzug, Gruppensieg usw. zu
schätzen.

### 6.1 Grundprinzip

Ein "Turnierdurchlauf" simuliert **jedes** noch offene Spiel zufällig
(Poisson-verteilte Zufallszahl mit dem jeweiligen Lambda, per
Knuth-Algorithmus), lässt daraus Tabellen/K.o.-Ergebnisse entstehen, und
zählt am Ende, welches Team Meister/Weltmeister wurde. Das wird
tausendfach wiederholt; die relative Häufigkeit ist die geschätzte
Wahrscheinlichkeit.

```
poissonRandom(λ):
  L = e^(−λ); k = 0; p = 1
  wiederhole: k++; p *= zufallszahl(0,1)
  bis p ≤ L
  return k − 1
```

(Seeded PRNG `mulberry32` für reproduzierbare Ergebnisse bei gleichem
Seed — praktisch für Debugging/Tests.)

### 6.2 Parameterunsicherheit (Variante A)

Statt eines einzigen deterministischen Laufs mit den "besten" Lambdas
werden **30 Parameter-Ziehungen** à **300 Turniersimulationen**
durchgeführt (= 9.000 Turniere gesamt). Bei jeder Parameter-Ziehung
werden alle Team-Angriffs-/Abwehrwerte mit log-normalem Rauschen
gestört:

```
perturb = exp( noise · z )     // z ~ Standardnormalverteilung (Box-Muller)
noise = 0,08                    // Standardabweichung
```

Das bildet die **Unsicherheit über die geschätzten Teamstärken** selbst
ab (nicht nur die Zufälligkeit einzelner Spielausgänge). Aus den 30
Ziehungen werden **Perzentilbänder** (5 %, 50 %-Median, 95 %) berechnet
— die App zeigt nicht nur einen Punktwert, sondern eine Bandbreite.

### 6.3 Bereits gespielte Partien fließen deterministisch ein

Für Spiele, deren Ergebnis feststeht, wird nicht simuliert, sondern das
reale Ergebnis direkt in die Tabellenberechnung übernommen
(`getResult()`). Nur noch offene Spiele werden zufällig ausgewürfelt.

### 6.4 Ensemble-Frage: Poisson allein oder + Elo?

Für **hypothetische** Paarungen (Teams, die in der Simulation
aufeinandertreffen könnten, aber noch nie real angesetzt wurden — z.B.
ein mögliches Halbfinale) gab es ursprünglich ein zweites Signal: ein
**Elo-Rating-Modell**, unabhängig von den historischen Torstatistiken:

```
λ_Elo_Heim     = 1,35 · exp( 0,0032 · (Elo_Heim − Elo_Auswärts) )
λ_Elo_Auswärts = 1,35 · exp(−0,0032 · (Elo_Heim − Elo_Auswärts) )
```

Ursprünglich (v2) wurde 60 % Poisson + 40 % Elo gemischt. Das wurde
**empirisch verworfen**: Am Lernprotokoll (34 Spiele) verschlechterte
jede Elo-Beimischung > 0 den Log-Loss (0,7891 rein Poisson vs. 0,7948 bei
40 % Elo). **Interpretation:** Die Elo-Information ist bereits über den
Marktquoten-Blend implizit vorhanden (Buchmacher kennen die
Weltrangliste auch); eine zusätzliche Beimischung dupliziert das Signal
redundant und verwässert das bessere Poisson-Signal.

**Seit v3.0.0 ("einheitliches Modell"):** Die Simulation nutzt **dasselbe
Poisson-Modell wie die Einzelspiel-Prognose** — für real terminierte
Paarungen sogar exakt dieselben marktkorrigierten Lambdas
(`lambdaMap`). Elo bleibt nur noch als **abschaltbarer Fallback-Modus**
(`modelConfig.ts`, `getModelMode(): 'unified' | 'classic'`) erhalten,
falls sich das einheitliche Modell im Live-Betrieb nicht bewähren sollte
— ein reiner Sicherheitsschalter, kein aktiver Bestandteil mehr.

**Wichtiger Nachtrag aus der finalen Turnier-Auswertung (n=51–53):** Die
Elo-Frage ist **nicht endgültig geklärt** — auf der größeren
K.o.-Runden-Stichprobe kippte der Befund teilweise wieder zugunsten einer
kleinen Elo-Beimischung (siehe `docs/calibration-analysis.md`,
Snapshot 2/3). Für die Liga: mit der viel größeren Datenbasis (306 statt
~50 Spiele/Saison) sauber neu validieren, nicht ungeprüft von der WM
übernehmen.

---

## 7. K.o.-Spezifische Anpassungen (WM-spezifisch — für die Liga NICHT übernehmen)

Diese Logik existiert **nur** für die K.o.-Phase der WM und muss beim
Bundesliga-Nachbau ersatzlos entfallen, da Ligaspiele immer nach 90
Minuten enden und Remis ein regulärer, häufiger Ausgang ist:

```ts
if (knockout) {
  wo = pH >= pA ? 'H' : 'A';                 // Remis-Tipp ausgeschlossen
  fp = Math.max(pH, pA) + pD / 2;             // Konfidenz inkl. Elfmeterschießen (50/50)
}
```

Begründung: Ein K.o.-Spiel endet spätestens im Elfmeterschießen mit
einem Sieger — ein Remis-Tipp wäre für die Praxis (Tippabgabe)
nutzlos. Die Siegwahrscheinlichkeit inklusive Verlängerung/Elfmeter wird
angenähert als "Sieg in 90 Minuten + hälftiger Anteil der
Remis-Wahrscheinlichkeit" (Elfmeterschießen ≈ Münzwurf).

---

## 8. Empirische Validierung — die Methodik, nicht nur das Ergebnis

Ein zentraler Baustein der App war das **Lernprotokoll** (`learnLog.ts`):
Für jedes Spiel wurde bei jeder Quotenänderung ein Snapshot gespeichert
(Modell-Lambda, markt-geblendetes Lambda, Marktquoten, Zeitstempel),
später ergänzt um das tatsächliche Ergebnis. Damit ließ sich rückwirkend
prüfen, welche Modellentscheidungen sich bewährt haben — **das gehört
mit in die Bundesliga-App übernommen**, nicht nur die Endwerte.

### 8.1 Alpha-Sweep (Marktgewichtung validieren)

Für ein exportiertes Lernprotokoll: Für jedes `α` von 0 bis 1 (Schritt
0,1, dann feiner 0,02) alle Spiele mit dem entsprechend gemischten
Lambda neu bewerten, Log-Loss/Brier-Score/Trefferquote berechnen, das
Optimum finden. So wurde α=0,5 bestätigt (siehe Abschnitt 4.2).

### 8.2 Look-ahead-Bias vermeiden

Wichtige Lektion aus der praktischen Anwendung: Nicht einfach den
*letzten* gespeicherten Snapshot eines Spiels nehmen (der kann bereits
Live-Quoten aus dem laufenden Spiel enthalten — z.B. wurde bei einem
Spiel kurz vor Schluss eine 94-%-Quote für das dann führende Team
erfasst, weil die App auch während des Spiels weiter Daten abrief).
Lösung: Nur Snapshots **vor** dem geplanten Anstoß verwenden, plus ein
Ausreißerfilter (Quotensprung zum Vorgänger-Snapshot > 12 Prozentpunkte
wird verworfen — typisches Signal für In-Play-Kontamination).

### 8.3 Dissens-Signal (wichtigster Befund für die Liga-Weiterentwicklung)

Bei Spielen, in denen Modell und Markt **unterschiedliche Sieger**
favorisieren ("Dissens"), wurde über das gesamte WM-Turnier ausgewertet,
wie diese Spiele tatsächlich ausgingen:

| | Anzahl | Anteil |
|---|---|---|
| Modell hatte recht | 4 | |
| Markt hatte recht | 1 | |
| **Remis** | 4 | **44 %** |
| *(zum Vergleich: Remis-Quote bei Einigkeit)* | 6 von 44 | *14 %* |

**Erkenntnis:** Ein Dissens zwischen Modell und Markt ist selbst ein
Signal — es korreliert deutlich mit einem offenen, schwer vorhersagbaren
Spiel (44 % Remis-Quote vs. 14 % Basisrate). **Für die Bundesliga ist das
ein konkreter Modellbaustein**, kein bloßes Beobachtungsdetail: Bei
erkanntem Vorzeichen-Dissens (Modell und Markt uneinig über H/A) sollte
der Remis-Prior aktiv angehoben werden, statt nur linear zu blenden —
in der Liga zahlt sich das direkt aus, weil Remis (anders als im
K.o.-Modus) ein regulärer, häufiger und tippbarer Ausgang ist.

### 8.4 Wett-Radar / Value-Betting (Erkenntnis-Werkzeug, kein Auto-Trader)

Ergänzend zur reinen Prognose berechnet die App für noch nicht
begonnene Spiele den Erwartungswert jeder Wettoption:

```
EV = Modellwahrscheinlichkeit * Dezimalquote_des_Buchmachers − 1
```

Nur Optionen mit `EV > 0,05` (5 %) werden angezeigt, mit einer
**Quarter-Kelly-Einsatzempfehlung**:

```
Kelly_Anteil = 0,25 * (p·odds − 1) / (odds − 1)
Einsatz = max(0, min(0,10, Kelly_Anteil))   // gedeckelt bei 10 % der Bankroll
```

**Wichtig:** Ein In-Sample-Backtest über die Gruppenphase zeigte
**keinen robusten Vorteil** von Value-Betting mit diesem Modell — die
Funktion führt deshalb zusätzlich ein **Paper-Trading-Konto** (jede
Empfehlung wird protokolliert und nach Spielende automatisch mit
gewonnen/verloren abgerechnet, ROI wird laufend angezeigt). Das macht
ehrlich sichtbar, ob das Modell dem Markt tatsächlich einen Vorteil
verschafft, statt das unbelegt zu behaupten. **Für die Liga empfohlen:**
dieselbe Struktur übernehmen — Value-Erkennung + Paper-Konto, kein
automatisiertes Echtgeld-Wetten, bis der ROI sich über eine ausreichend
große Stichprobe als tatsächlich positiv erweist.

---

## 9. Zusammenfassung: Die vollständige Formel für ein Spiel

Als kompakte Merkformel, alle Schichten zusammen:

```
1. TeamStats(Heim, Auswärts)                     ← IPF-trainiert, turniergewichtet, zeitgedämpft
2. λ_Heim, λ_Auswärts = Angriff × gegn. Abwehr    ← Basis-Poisson-Lambda
3. λ_Heim_markt, λ_Auswärts_markt                 ← Newton-Raphson auf Marktquote (falls vorhanden)
4. λ_final = 0,5·λ_Basis + 0,5·λ_Markt            ← validierter Blend
5. Tormatrix = Poisson(λ_final) × Dixon-Coles(ρ=−0,13)
6. pH, pD, pA = Zeilen-/Spaltensummen der Matrix, normiert
7. pH, pD, pA = Platt-Scaling(pH, pD, pA)         ← falls n≥45 Live-Spiele, sonst Shrink zum Prior
8. Tipp = wahrscheinlichstes Ergebnis in Richtung des höchsten pX
```

Parallel dazu, unabhängig pro Spiel:

```
9. Turnier-Simulation: 30 × 300 Monte-Carlo-Läufe mit demselben
   Basis-Lambda-Modell (+ Parameterunsicherheit) → Titel-/Aufstiegschancen
   als Median + 90-%-Konfidenzband
```

---

## 10. Vom Turnier zur Liga — was konkret geändert werden muss

Dies ist die Anleitung, um dieselbe Modelllogik für eine
Bundesliga-Prognose-App zu übernehmen. Reihenfolge nach Wichtigkeit:

### 10.1 Heimvorteil reaktivieren (Pflicht, größter Unterschied)

Bei der WM wurde der Heim-/Auswärtsunterschied künstlich neutralisiert
(`hGF == aGF`, `hGA == aGA`), weil Turnierspiele auf neutralem Boden
stattfinden. **In der Bundesliga ist der Heimvorteil eines der
stärksten bekannten Signale im Fußball** und muss unbedingt erhalten
bleiben:

```
TeamStats bekommt echte getrennte Werte:
  hGF/hGA = Tore erzielt/kassiert NUR bei Heimspielen
  aGF/aGA = Tore erzielt/kassiert NUR bei Auswärtsspielen
```
Die Lambda-Formel (`hAtt·aDef` für Heim, `aAtt·hDef` für Auswärts)
bleibt unverändert — sie war von Anfang an heim-/auswärts-fähig
konzipiert, wurde für die WM nur mit identischen Inputs "stillgelegt".

### 10.2 Statische Teamstärken → rollierende Saison-Statistik

Bei der WM wurden `NATION_STATS` einmalig vor Turnierbeginn trainiert und
blieben dann fix. Eine Bundesligasaison läuft über 34 Spieltage — die
Statistik sollte **mit der Saison mitwachsen**:

- Nach jedem Spieltag: Teamstärken aus den bis dahin gespielten Partien
  der laufenden Saison neu berechnen (gleiches IPF-Prinzip wie beim
  Training, aber laufend aktualisiert statt einmalig).
- Zusätzlich eine **Formkurve** einführen (bei der WM aus Datenmangel
  bewusst weggelassen): ein gewichteter Durchschnitt der letzten N Spiele
  stärker gewichten als die Saison-Gesamtstatistik, z.B.
  ```
  Team-Stärke = 0,6 · Saison-Gesamt + 0,4 · gewichtete_Form(letzte_5_Spiele, decay=0,72)
  ```

### 10.3 Kaltstart-Problem lösen (Spieltag 1–5)

Am Saisonanfang gibt es noch keine oder kaum Daten der laufenden Saison.
Lösung:
- **Prior aus der Vorsaison** (gewichtet, mit Zeitdecay wie in Abschnitt
  2.2) als Startwert nehmen.
- **Aufsteiger** ohne Bundesliga-Historie: Liga-Durchschnittswerte mit
  einem Abschlag (Aufsteiger sind historisch im Schnitt schwächer als der
  Ligadurchschnitt) als Startpunkt.
- **Gleitender Übergang:** Je mehr Spiele der laufenden Saison vorliegen,
  desto stärker gewichten, z.B. `Gewicht_Live = n_live / (n_live + 6)` —
  ähnliches Prinzip wie die Kalibrierungs-Regularisierung in Abschnitt 5.4.

### 10.4 K.o.-spezifische Logik entfernen

Siehe Abschnitt 7 — Remis-Sperre und Elfmeterschießen-Konfidenz komplett
raus. Ligaspiele werden immer regulär mit H/D/A getippt.

### 10.5 Kalibrierung neu trainieren

`HARDCODED_CALIB` muss auf Bundesliga-Ergebnissen (nicht WM-Daten) neu
trainiert werden — idealerweise die letzten 2–3 Spielzeiten (ca. 600–900
Spiele), mit demselben Platt-Scaling-Verfahren aus Abschnitt 5.2/5.3.
Die Live-Update-Logik (5.4) bleibt strukturell identisch, nur mit einer
höheren Sicherheitsschwelle vor Aktivierung sinnvoll, da pro Saison mehr
Spiele anfallen (z.B. `n >= 90` statt 45).

### 10.6 Marktquellen umstellen

- **Ergebnisse/Spielplan:** OpenLigaDB (kostenlos, gut dokumentiert,
  liefert auch Spieltagsnummern — Vorteil: kein manuelles
  Datum-Clustering nötig wie bei der WM, echte Spieltage 1–34 sind direkt
  verfügbar).
- **Odds API:** exakter Sport-Key `soccer_germany_bundesliga` verwenden
  (nicht per Fuzzy-Suche/`includes()` — bei der WM führte eine zu lockere
  Sport-Key-Erkennung einmal dazu, dass versehentlich Quoten eines
  komplett anderen Wettbewerbs (EFL Cup) geladen wurden; exakter Treffer
  zuerst, Fuzzy nur als dokumentierter Fallback).

### 10.7 Startwerte für die Marktgewichtung

Aus der finalen WM-Auswertung (n=53, siehe `docs/calibration-analysis.md`
im Original-Repo): **α = 0,4** als Startwert (Mitte des empirisch flachen
Optimal-Tals zwischen 0,22 und 0,5). Nach den ersten ~5 Spieltagen der
Bundesliga mit dem echten Lernprotokoll neu validieren — Liga-Märkte sind
in der Regel effizienter/liquider als Turniermärkte, das Optimum kann
niedriger liegen (mehr Modell, weniger Markt).

### 10.8 Was 1:1 unverändert übernommen werden kann

- Poisson + Dixon-Coles-Tormatrix (Abschnitt 3) — komplett generisch,
  keine WM-Annahmen enthalten.
- Newton-Raphson-Marktkorrektur (Abschnitt 4.1) — ebenfalls generisch.
- Platt-Scaling-Mechanik (Abschnitt 5) — nur die Trainingsdaten und
  Prior-Parameter ändern sich, das Verfahren bleibt.
- Monte-Carlo-Simulation mit Parameterunsicherheit (Abschnitt 6.1–6.2) —
  für Meisterschaft/Europapokal-Plätze/Abstieg statt Weltmeister/
  Halbfinale/Gruppensieg; die Turnierbaum-Logik (K.o.-Runden) entfällt,
  eine reine Saison-Tabellensimulation über das Restprogramm ersetzt sie.
- Lernprotokoll-Infrastruktur (Abschnitt 8.1–8.3) — vollständig
  wiederverwendbar, liefert ab Spieltag 1 verwertbare Validierungsdaten.
- Wett-Radar + Paper-Trading (Abschnitt 8.4) — unverändert übernehmbar,
  in der Liga sogar aussagekräftiger, weil Remis-Wetten dort nicht wie im
  K.o.-Modus ausgeschlossen werden müssen.
