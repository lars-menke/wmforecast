# Simulation & Vorhersage-Pipeline

Implementierungs-Spec für das WM-Forecast-Tool.
Beschreibt das konkrete Vorgehen, um aus historischen Spielen eine **kalibrierte**
Turnierprognose zu erzeugen — inklusive Hyperparameter-Suche, Unsicherheitsbändern
und Modell-Kombination.

Begleitcode: `forecast_core.py` (Poisson/Dixon-Coles, `fit_model`, `TournamentSimulator`).

---

## 0. Grundprinzip (bitte zuerst lesen)

Es gibt zwei Arten von "Parametern" — sie werden komplett unterschiedlich behandelt:

| Typ | Beispiele | Wie bestimmt? |
|-----|-----------|---------------|
| **Modellparameter** | α (Angriff), β (Abwehr), γ (Heim), ρ (Dixon-Coles) | **berechnet** per Maximum-Likelihood aus vergangenen Spielen (`fit_model`). NICHT raten. |
| **Hyperparameter** | ξ (Zeitgewichtung), max_goals, DC an/aus, Ensemble-Gewicht | **durchprobiert** und per Backtesting bewertet. |

**Goldene Regel:** Modellgüte wird IMMER gegen zurückgehaltene, dem Modell unbekannte
Spiele gemessen — nie gegen sich selbst. "Parameter so lange drehen, bis das
Wunschergebnis rauskommt" ist kein Modell, sondern Overfitting.

Gütemaß: **Log-Loss** (alternativ Brier-Score). Niedriger = besser.

---

## 1. Datengrundlage

Pro Spiel benötigt: `home, away, hg (Heimtore), ag (Auswärtstore), date, neutral`.

Quellen:
- Länderspielergebnisse (Quali, Nations League, Freundschaftsspiele).
- Elo-Ratings je Team als globaler Anker (löst das Turnier-Datenproblem,
  s. Abschnitt 5).
- Optional: Buchmacher-Quoten als externe Benchmark.

Datenformat (JSON, vom Backend ins Git/PWA):

```json
{
  "matches": [
    {"home": "GER", "away": "FRA", "hg": 2, "ag": 1,
     "date": "2025-09-06", "neutral": false}
  ],
  "elo": {"GER": 1980, "FRA": 2010, "BRA": 2030}
}
```

---

## 2. Zeitgewichtung

Jedes Spiel wird nach Alter exponentiell gewichtet:

```
w(t) = exp(-xi * tage_seit_spiel)
```

`xi` ist ein Hyperparameter (typischer Bereich 0.0005–0.005 bei Tagen).
Der konkrete Wert wird in Abschnitt 4 per Backtesting bestimmt, nicht geraten.

---

## 3. Gütemaß: Log-Loss

Für ein Spiel mit tatsächlichem Ausgang (Heimsieg / Remis / Auswärtssieg) und den
vom Modell vorhergesagten Wahrscheinlichkeiten p_home, p_draw, p_away:

```
log_loss_spiel = -log( p_tatsächlicher_ausgang )
```

Über alle Test-Spiele mitteln. Je kleiner, desto besser kalibriert.

```python
import math

def match_log_loss(probs: dict, outcome: str) -> float:
    # outcome in {"home", "draw", "away"}
    p = {"home": probs["p_home"],
         "draw": probs["p_draw"],
         "away": probs["p_away"]}[outcome]
    return -math.log(max(p, 1e-12))   # Clipping gegen log(0)

def actual_outcome(hg: int, ag: int) -> str:
    return "home" if hg > ag else "away" if ag > hg else "draw"
```

---

## 4. Backtesting & Hyperparameter-Suche

Kernidee: zeitlicher Split. Fitte das Modell NUR auf Spielen vor einem Stichtag,
sage die Spiele danach vorher, miss den Log-Loss. Wiederhole für mehrere ξ-Werte,
nimm das ξ mit dem niedrigsten mittleren Log-Loss.

### Ablauf (Pseudocode → direkt in forecast_core.py umsetzbar)

```python
import numpy as np
from datetime import date

def days_between(d1: str, d2: str) -> int:
    return (date.fromisoformat(d2) - date.fromisoformat(d1)).days

def weighted_matches(raw, ref_date, xi):
    """Erzeugt Match-Liste mit Zeitgewichten relativ zu ref_date."""
    out = []
    for m in raw:
        t = days_between(m["date"], ref_date)
        if t < 0:               # nur Spiele VOR dem Stichtag
            continue
        w = float(np.exp(-xi * t))
        out.append(Match(m["home"], m["away"], m["hg"], m["ag"],
                         weight=w, neutral=m["neutral"]))
    return out

def backtest(raw, xi_grid, split_date):
    """
    Trainiert je xi auf Spielen < split_date,
    testet auf Spielen >= split_date, gibt {xi: mittlerer_log_loss} zurück.
    """
    train = [m for m in raw if m["date"] < split_date]
    test  = [m for m in raw if m["date"] >= split_date]
    results = {}
    for xi in xi_grid:
        model = fit_model(weighted_matches(train, split_date, xi),
                          use_dixon_coles=True)
        losses = []
        for m in test:
            # Teams, die im Training fehlen, ueberspringen
            if m["home"] not in model.attack or m["away"] not in model.attack:
                continue
            probs = match_probabilities(model, m["home"], m["away"],
                                        neutral=m["neutral"])
            losses.append(match_log_loss(probs, actual_outcome(m["hg"], m["ag"])))
        results[xi] = float(np.mean(losses)) if losses else float("inf")
    return results

# Verwendung:
# grid = [0.0, 0.0005, 0.001, 0.002, 0.003, 0.005]
# scores = backtest(raw_matches, grid, "2025-06-01")
# best_xi = min(scores, key=scores.get)
```

### Robuster: rollierendes Backtesting (walk-forward)

Statt nur eines Stichtags mehrere nutzen (z. B. monatlich), Log-Loss über alle
Fenster mitteln. Stabiler gegen Zufall eines einzelnen Splits.

```python
def walk_forward(raw, xi_grid, split_dates):
    agg = {xi: [] for xi in xi_grid}
    for sd in split_dates:
        scores = backtest(raw, xi_grid, sd)
        for xi, s in scores.items():
            if s != float("inf"):
                agg[xi].append(s)
    return {xi: float(np.mean(v)) for xi, v in agg.items() if v}
```

**Output dieses Schritts:** ein begründetes `best_xi`, das ab jetzt fest verwendet wird.

---

## 5. Elo-Anker (Turnier-Datenproblem lösen)

Bei der WM treffen viele Teams nie aufeinander → reines Poisson-Fit instabil.
Elo liefert eine gemeinsame Skala für alle Teams.

Erwartete Punktausbeute A gegen B:

```
E_A = 1 / (1 + 10^((R_B - R_A) / 400))
```

Aus der Elo-Differenz ein erwartetes λ ableiten und als **Prior/Startwert** in den
Fit geben (oder als eigenständiges Modell fürs Ensemble nutzen).

Pragmatische Variante für ein eigenständiges Elo-Tor-Modell:

```python
def elo_to_lambdas(elo_home, elo_away, base=1.4, neutral=True,
                   home_bonus=60, scale=0.0035):
    diff = (elo_home + (0 if neutral else home_bonus)) - elo_away
    lam_h = base * np.exp( scale * diff)
    lam_a = base * np.exp(-scale * diff)
    return lam_h, lam_a
```

`scale` und `home_bonus` sind ebenfalls per Backtesting (Abschnitt 4) bestimmbar.

---

## 6. Parameter-Unsicherheit (Konfidenzbänder)

Eine Punktprognose "GER 18 %" täuscht Präzision vor. Besser: Unsicherheit
mitsimulieren, indem die geschätzten Teamstärken leicht variiert werden.

### Variante A — parametrisch (schnell)

Teamstärken mehrfach mit kleinem Rauschen ziehen, je Ziehung ein Turnier simulieren.

```python
def simulate_with_uncertainty(base_model, groups, n_param_draws=200,
                              n_sims_each=2000, noise=0.08, seed=42):
    rng = np.random.default_rng(seed)
    teams = list(base_model.attack)
    title_runs = {t: [] for t in teams}
    for _ in range(n_param_draws):
        perturbed = PoissonModel(
            attack={t: base_model.attack[t] * float(np.exp(rng.normal(0, noise)))
                    for t in teams},
            defense={t: base_model.defense[t] * float(np.exp(rng.normal(0, noise)))
                     for t in teams},
            home_adv=base_model.home_adv, base=base_model.base, rho=base_model.rho,
        )
        sim = TournamentSimulator(perturbed, groups, rng=rng)
        res = sim.run(n_sims_each)
        for t in teams:
            title_runs[t].append(res.get(t, 0.0))
    # Median + 5/95-Perzentil als Band
    return {t: {"median": float(np.median(v)),
                "low":  float(np.percentile(v, 5)),
                "high": float(np.percentile(v, 95))}
            for t, v in title_runs.items()}
```

### Variante B — Bootstrap (sauberer, langsamer)

Statt Rauschen die Match-Liste mit Zurücklegen neu ziehen (Bootstrap-Sample),
je Sample neu fitten, dann simulieren. Spiegelt echte Schätzunsicherheit wider.

**Output:** je Team ein Band (low/median/high) statt einer einzelnen Zahl.

---

## 7. Modell-Kombination (Ensemble)

Zwei unabhängige Modelle mitteln schlägt in der Praxis fast immer das Einzelmodell:
Poisson-Fit (Abschnitt 1–4) + Elo-Modell (Abschnitt 5).

```python
def ensemble_probs(p_poisson: dict, p_elo: dict, w_poisson=0.6) -> dict:
    w_e = 1 - w_poisson
    out = {}
    for key in ("p_home", "p_draw", "p_away"):
        out[key] = w_poisson * p_poisson[key] + w_e * p_elo[key]
    s = out["p_home"] + out["p_draw"] + out["p_away"]
    return {k: v / s for k, v in out.items()}   # renormieren
```

Das Gewicht `w_poisson` ist ein Hyperparameter → per Backtesting (Abschnitt 4)
auf minimalen Log-Loss optimieren.

---

## 8. Gesamtpipeline (Reihenfolge)

```
1. Daten laden (matches + elo)                         -> JSON
2. best_xi per walk_forward bestimmen                  -> Hyperparameter fix
3. Finales Poisson-Modell auf ALLEN Spielen fitten     -> fit_model(best_xi)
4. Elo-Modell aufbauen                                 -> elo_to_lambdas
5. (optional) Ensemble-Gewicht per Backtest bestimmen
6. Einzelspiel-Prognosen erzeugen                      -> match_probabilities
7. Turnier mit Unsicherheit simulieren                 -> simulate_with_uncertainty
8. Ergebnisse als JSON exportieren                     -> ins Git / PWA
9. Nach jedem realen Spieltag: echte Ergebnisse rein, ab Schritt 3 neu rechnen
```

---

## 9. Export-Format für die PWA

Backend rechnet, PWA rendert nur. Vorschlag:

```json
{
  "generated_at": "2026-06-15T18:00:00Z",
  "best_xi": 0.002,
  "model_logloss": 0.98,
  "matches": [
    {"home": "GER", "away": "FRA", "neutral": true,
     "p_home": 0.55, "p_draw": 0.27, "p_away": 0.18,
     "most_likely": [1, 1]}
  ],
  "title_odds": [
    {"team": "BRA", "median": 0.19, "low": 0.14, "high": 0.24},
    {"team": "GER", "median": 0.16, "low": 0.11, "high": 0.21}
  ]
}
```

Reproduzierbarkeit: festen RNG-Seed verwenden und `generated_at` + `best_xi` +
`model_logloss` mitschreiben, damit jede Prognose nachvollziehbar ist.

---

## 10. Validierungs-Checkliste (vor dem Vertrauen ins Tool)

- [ ] Log-Loss des finalen Modells < Log-Loss eines Dummy-Modells
      (Dummy = immer historische Basisrate Heim/Remis/Auswärts).
- [ ] Kalibrierung geprüft: von allen "60 %"-Tipps treten ~60 % ein
      (Reliability-Diagramm).
- [ ] Vergleich gegen Buchmacher-Quoten (implizite Wahrscheinlichkeit = 1/Quote,
      um die Marge normiert) — als Realitäts-Check, nicht als Ziel.
- [ ] Titel-Bänder plausibel (keine 80 %-Favoriten bei 48 Teams).
- [ ] Ergebnis reproduzierbar (gleicher Seed -> gleiche Zahlen).
```
