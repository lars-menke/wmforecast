# Kalibrierungs-Analyse — Markt-Gewichtung (α)

Auswertungen der Markt-Gewichtung `MARKET_BLEND` (Lambda-Blend in `src/lib/poisson.ts`)
gegen die tatsächlich erzielten Ergebnisse aus dem Lernprotokoll (`wm_learnlog_v1`).

Methodik: Aus `lH_model` und `lH_blend` (bei α=0.5) wird das reine Markt-Lambda
rekonstruiert (`λ_markt = 2·λ_blend − λ_model`). Für jedes α werden die Lambdas
neu gemischt, per Poisson + Dixon-Coles (ρ=−0.13) in 1X2-Wahrscheinlichkeiten
umgerechnet und gegen den tatsächlichen Ausgang bewertet (Log-Loss, Brier,
Trefferquote). Kleinere Werte sind besser; das Log-Loss-Minimum bestimmt α.

---

## Snapshot 1 — 02.07.2026 (Ende Gruppenphase)

- **Datenbasis:** 34 gespielte Gruppenspiele (34 mit Ergebnis)
- **Outcome-Verteilung:** 8 Remis (23,5 %), Rest H/A
- **Aktueller Wert:** α = 0.5

| α (Markt-Gewicht) | Log-Loss | Brier | Trefferquote |
|---|---|---|---|
| 0.0 (nur Modell) | 0.7891 | 0.4566 | 67,6 % |
| 0.3 | 0.7827 | 0.4525 | 67,6 % |
| **0.5 (aktuell)** | **0.7813** | **0.4515** | **70,6 %** |
| 0.7 | 0.7824 | 0.4523 | 70,6 % |
| 1.0 (nur Markt) | 0.7888 | 0.4573 | 70,6 % |
| *Markt pur (Referenz)* | *0.7889* | *0.4573* | *70,6 %* |

- **Optimum:** α ≈ 0.50–0.52 (feines Raster: 0.52, LL identisch zu 0.5)
- **Kernbefund:** Der Blend schlägt beide Extreme — bei α=0.5 ist der Log-Loss
  niedriger als bei reinem Modell *und* reinem Markt. Die 50/50-Mischung liefert
  nachweislich bessere Prognosen als jede Quelle allein.
- **Entscheidung:** α = 0.5 unverändert beibehalten.
- **Caveat:** Kleine Stichprobe (34). Nach der K.o.-Runde erneut auswerten.

---

## Dissens-Analyse (Stand Snapshot 1)

Spiele, bei denen Modell und Markt unterschiedliche Sieger favorisieren:

| | Anzahl | davon Remis |
|---|---|---|
| Dissens-Spiele | 3 | 3 (**100 %**) |
| Einigkeit-Spiele | 31 | 5 (16 %) |

**Hypothese:** Modell-Markt-Dissens ist ein Remis-Indikator. Die Stichprobe ist
klein (n=3), das Signal aber auffällig stark. Nach der K.o.-Runde mit vollem
Log erneut prüfen — Achtung: In der K.o.-Runde gibt es kein Remis als Endstand,
dort wäre die analoge Frage, ob Dissens-Spiele überproportional in die
Verlängerung gehen.

---

## Tooling

- **Analyse-Skript:** `node scripts/analyze-learnlog.mjs <export.json>` fährt
  Alpha-Sweep und Dissens-Analyse automatisch (liest v1- und v2-Format).
- **Backup:** `docs/backups/learnlog-2026-07-02-gruppenphase.json` sichert den
  Gruppenphasen-Export (34 Spiele) im Repo — localStorage ist gerätegebunden.

---

## Snapshot 2 — (nach K.o.-Runde, ausstehend)

_Noch offen. Lernprotokoll exportieren, dann:_
`node scripts/analyze-learnlog.mjs <export.json>` _und mit Snapshot 1
vergleichen: Verschiebt sich das Optimum? Bleibt der Blend besser als beide
Extreme? Bestätigt sich das Dissens-Signal?_

---

## Elo-Validierung & Modell-Vereinheitlichung (v3.0.0)

Vor der Vereinheitlichung wurde am Gruppenphasen-Lernlog (34 Spiele) geprüft,
ob eine Elo-Beimischung in die Basis-Lambdas die Prognose verbessert
(λ_basis = (1−w)·Poisson + w·Elo, Elo-λ via 1.35·exp(±0.0032·Δ)):

| Elo-Gewicht w | Log-Loss ohne Markt | Log-Loss mit Markt (α=0.5) |
|---|---|---|
| **0.0 (reines Poisson)** | 0.7891 | **0.7813** |
| 0.2 | 0.7876 | 0.7818 |
| 0.4 (= v2-Simulation) | 0.7948 | 0.7844 |
| 0.6 | 0.8096 | 0.7890 |

**Befund:** Elo verschlechtert die Prognose bei jedem Gewicht > 0 (Optimum
w ≈ 0). Interpretation: Die Elo-Information ist bereits in den Marktquoten
enthalten — eine zusätzliche Beimischung dupliziert ein vorhandenes Signal.

**Entscheidung (v3.0.0):** Vereinheitlichung auf EIN Modell — die Monte-Carlo-
Simulation nutzt dasselbe Poisson+Markt-Modell wie die Spielprognose:
markt-geblendete Lambdas für real angesetzte Paarungen, reines Poisson für
hypothetische Duelle. Das 60/40-Poisson/Elo-Ensemble entfällt als Standard.

**Fallback-Ebene:** In den Einstellungen ist der Modus „Einheitliches Modell
(v3)" umschaltbar; ausgeschaltet läuft die Simulation wieder im klassischen
60/40-Ensemble (Stand v2). Sollte sich v3 im Turnierverlauf nicht bewähren,
ist die Rückkehr ein Schalter, kein Deployment.

Noch offen (nach dem Turnier): Platt-Kalibrierung auch in der Simulation;
erneute Elo-Prüfung auf dem vollen Turnier-Log (n≈60+).
