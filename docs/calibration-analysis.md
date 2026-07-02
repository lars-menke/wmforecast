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

## Snapshot 2 — (nach K.o.-Runde, ausstehend)

_Noch offen. Gleiche Methodik anwenden und mit Snapshot 1 vergleichen:
Verschiebt sich das Optimum? Bleibt der Blend besser als beide Extreme?_
