// Modell-Modus mit Fallback-Ebene (v3-Vereinheitlichung).
//
// 'unified' (v3, Default): Eine Modellwelt — die Monte-Carlo-Simulation nutzt
//   dasselbe Poisson-Modell wie die Spielprognose (markt-geblendete Lambdas
//   für reale Paarungen, reines Poisson für hypothetische). Das Elo-
//   Parallelmodell entfällt; empirisch validiert am Gruppenphasen-Lernlog
//   (Elo-Beimischung verschlechtert den Log-Loss bei jedem Gewicht > 0,
//   siehe docs/calibration-analysis.md).
//
// 'classic' (v2, Fallback): Simulation läuft wie zuvor mit dem
//   60/40-Poisson/Elo-Ensemble. Umschaltbar in den Einstellungen, falls
//   sich der einheitliche Modus im Turnierverlauf nicht bewährt.

const KEY = 'wm_model_mode_v3';

export type ModelMode = 'unified' | 'classic';

export function getModelMode(): ModelMode {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === 'classic') {
      return 'classic';
    }
  } catch { /* ignore */ }
  return 'unified';
}

export function setModelMode(mode: ModelMode): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, mode);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Wett-Radar: EV-basierte Wettvorschlaege ein-/ausblenden.
// Ausgeschaltet bleibt die App ein reines Sport-Prognosemodell.
// ---------------------------------------------------------------------------

const BET_RADAR_KEY = 'wm_betradar_v1';

export function isBetRadarEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(BET_RADAR_KEY) === 'off') {
      return false;
    }
  } catch { /* ignore */ }
  return true;
}

export function setBetRadarEnabled(on: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(BET_RADAR_KEY, on ? 'on' : 'off');
  } catch { /* ignore */ }
}
