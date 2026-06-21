// Passive learning log: records pre-match model/market lambdas and post-match
// actual outcomes. Used to empirically tune MARKET_BLEND after the group stage.

const LOG_KEY = 'wm_learnlog_v1';

export type LearnEntry = {
  matchId: string;       // e.g. "TUR-PAR"
  kickoff: string;       // ISO string
  lH_model: number;      // raw Poisson lambda (no market)
  lA_model: number;
  lH_blend: number;      // blended lambda actually used
  lA_blend: number;
  oddsH: number;         // implied market prob 0-1
  oddsD: number;
  oddsA: number;
  actual: 'H' | 'D' | 'A' | null;  // filled after match
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

// Called before each match (when odds are available). Upserts the entry.
export function logPreMatch(entry: Omit<LearnEntry, 'actual'>): void {
  const entries = loadLog();
  const idx = entries.findIndex(e => e.matchId === entry.matchId);
  const full: LearnEntry = { ...entry, actual: entries[idx]?.actual ?? null };
  if (idx >= 0) entries[idx] = full;
  else entries.push(full);
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
