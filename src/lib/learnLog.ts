// Passive learning log: records a time series of pre-match model/market
// snapshots (one per odds update) plus the post-match actual outcome.
// Used to empirically tune MARKET_BLEND and to explain how a prediction
// moved between the model and the market as odds updated over time.

const LOG_KEY = 'wm_learnlog_v2';
const MAX_SNAPSHOTS_PER_MATCH = 200; // Deckel gegen unbegrenztes Wachstum

export type LearnSnapshot = {
  ts: number;             // Date.now() beim Schreiben dieses Snapshots
  lH_model: number;       // raw Poisson lambda (no market)
  lA_model: number;
  lH_blend: number;       // blended lambda actually used
  lA_blend: number;
  oddsH: number;          // implied market prob 0-1
  oddsD: number;
  oddsA: number;
};

export type LearnEntry = {
  matchId: string;             // e.g. "TUR-PAR"
  kickoff: string;              // ISO string
  snapshots: LearnSnapshot[];   // chronologisch, älteste zuerst
  actual: 'H' | 'D' | 'A' | null;
};

function loadLog(): LearnEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]');
  } catch { return []; }
}

function saveLog(entries: LearnEntry[]): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch { /* storage full */ }
}

function sameSnapshot(a: LearnSnapshot, b: Omit<LearnSnapshot, 'ts'>): boolean {
  const eps = 1e-6;
  return Math.abs(a.oddsH - b.oddsH) < eps
    && Math.abs(a.oddsD - b.oddsD) < eps
    && Math.abs(a.oddsA - b.oddsA) < eps;
}

// Called on every load when odds are available. Appends a new snapshot only
// if the market values actually changed since the last one — dedupes repeat
// calls within the same odds-cache window instead of writing noise.
export function logPreMatch(entry: {
  matchId: string;
  kickoff: string;
  lH_model: number; lA_model: number;
  lH_blend: number; lA_blend: number;
  oddsH: number; oddsD: number; oddsA: number;
}): void {
  const entries = loadLog();
  const idx = entries.findIndex(e => e.matchId === entry.matchId);
  const snapshot: LearnSnapshot = {
    ts: Date.now(),
    lH_model: entry.lH_model, lA_model: entry.lA_model,
    lH_blend: entry.lH_blend, lA_blend: entry.lA_blend,
    oddsH: entry.oddsH, oddsD: entry.oddsD, oddsA: entry.oddsA,
  };

  if (idx >= 0) {
    const existing = entries[idx];
    const last = existing.snapshots[existing.snapshots.length - 1];
    if (!last || !sameSnapshot(last, entry)) {
      existing.snapshots.push(snapshot);
      if (existing.snapshots.length > MAX_SNAPSHOTS_PER_MATCH) {
        existing.snapshots.splice(0, existing.snapshots.length - MAX_SNAPSHOTS_PER_MATCH);
      }
    }
  } else {
    entries.push({ matchId: entry.matchId, kickoff: entry.kickoff, snapshots: [snapshot], actual: null });
  }
  saveLog(entries);
}

// Called after match is finished. Fills in the actual outcome.
export function logPostMatch(matchId: string, actual: 'H' | 'D' | 'A'): void {
  const entries = loadLog();
  const idx = entries.findIndex(e => e.matchId === matchId);
  if (idx >= 0) {
    entries[idx].actual = actual;
    saveLog(entries);
  }
}

// Returns the full log for analysis.
export function readLog(): LearnEntry[] {
  return loadLog();
}

// Returns the snapshot history for one match (chronological), or [] if none.
export function getMatchHistory(matchId: string): LearnSnapshot[] {
  return loadLog().find(e => e.matchId === matchId)?.snapshots ?? [];
}

// Pretty-printed JSON for manual export/analysis.
export function exportLogText(): string {
  return JSON.stringify(loadLog(), null, 2);
}

// Number of entries with a recorded outcome (usable for calibration analysis).
export function logStats(): { total: number; withOutcome: number } {
  const entries = loadLog();
  return {
    total: entries.length,
    withOutcome: entries.filter(e => e.actual !== null).length,
  };
}
