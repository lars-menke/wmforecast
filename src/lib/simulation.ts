import { NATION_STATS, ELO_RATINGS } from './nations';
import { WM_SCHEDULE } from './schedule';
import type { MatchResult } from './fetchResults';

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — reproduzierbare Ergebnisse pro Seed
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Poisson random draw (Knuth algorithm)
// ---------------------------------------------------------------------------

function poissonRandom(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

// ---------------------------------------------------------------------------
// Elo-basiertes Lambda-Modell (Spec Abschnitt 5)
// ---------------------------------------------------------------------------

const ELO_BASE  = 1.35; // erwartete Tore pro Team im Durchschnittsspiel
const ELO_SCALE = 0.0032;

function eloToLambdas(eloH: number, eloA: number): { lH: number; lA: number } {
  const diff = eloH - eloA; // neutral ground, kein Heimvorteil
  const lH = Math.min(4.5, Math.max(0.3, ELO_BASE * Math.exp( ELO_SCALE * diff)));
  const lA = Math.min(4.5, Math.max(0.3, ELO_BASE * Math.exp(-ELO_SCALE * diff)));
  return { lH, lA };
}

// ---------------------------------------------------------------------------
// Poisson-Lambda aus NATION_STATS (optional mit Perturbation)
// ---------------------------------------------------------------------------

function poissonLambdas(
  homeCode: string,
  awayCode: string,
  perturbAtt: Record<string, number>,
  perturbDef: Record<string, number>,
): { lH: number; lA: number } {
  const h = NATION_STATS[homeCode];
  const a = NATION_STATS[awayCode];
  if (!h || !a) return { lH: 1.0, lA: 1.0 };

  const hAtt = ((h.hGF + h.aGF) / 2) * (perturbAtt[homeCode] ?? 1);
  const hDef = ((h.hGA + h.aGA) / 2) * (perturbDef[homeCode] ?? 1);
  const aAtt = ((a.hGF + a.aGF) / 2) * (perturbAtt[awayCode] ?? 1);
  const aDef = ((a.hGA + a.aGA) / 2) * (perturbDef[awayCode] ?? 1);

  const lH = Math.min(4.5, Math.max(0.3, hAtt * aDef));
  const lA = Math.min(4.5, Math.max(0.3, aAtt * hDef));
  return { lH, lA };
}

// ---------------------------------------------------------------------------
// Ensemble: Poisson (60%) + Elo (40%) — Spec Abschnitt 7
// ---------------------------------------------------------------------------

const W_POISSON = 0.60;
const W_ELO     = 1 - W_POISSON;

function ensembleLambdas(
  homeCode: string,
  awayCode: string,
  perturbAtt: Record<string, number>,
  perturbDef: Record<string, number>,
): { lH: number; lA: number } {
  const poi = poissonLambdas(homeCode, awayCode, perturbAtt, perturbDef);
  const eloH = ELO_RATINGS[homeCode] ?? 1600;
  const eloA = ELO_RATINGS[awayCode] ?? 1600;
  const elo  = eloToLambdas(eloH, eloA);
  return {
    lH: W_POISSON * poi.lH + W_ELO * elo.lH,
    lA: W_POISSON * poi.lA + W_ELO * elo.lA,
  };
}

// ---------------------------------------------------------------------------
// Standing row
// ---------------------------------------------------------------------------

type SimStandingRow = { code: string; pts: number; gd: number; gf: number };

// ---------------------------------------------------------------------------
// Simulate a knockout match (returns winner code)
// ---------------------------------------------------------------------------

function simKnockout(
  home: string, away: string,
  perturbAtt: Record<string, number>,
  perturbDef: Record<string, number>,
  rng: () => number,
): string {
  if (home === 'BYE') return away;
  if (away === 'BYE') return home;
  const { lH, lA } = ensembleLambdas(home, away, perturbAtt, perturbDef);
  const g1 = poissonRandom(lH, rng);
  const g2 = poissonRandom(lA, rng);
  if (g1 > g2) return home;
  if (g2 > g1) return away;
  return rng() < 0.5 ? home : away;
}

// ---------------------------------------------------------------------------
// Run one full tournament, return title counts per team
// ---------------------------------------------------------------------------

function selectBest8Third(thirdPlaceTeams: SimStandingRow[]): string[] {
  return thirdPlaceTeams
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .map(t => t.code);
}

function runTournamentBatch(
  n: number,
  groups: Record<string, string[]>,
  groupMatches: Array<{ group: string; home: string; away: string }>,
  getResult: (home: string, away: string) => [number, number] | null,
  perturbAtt: Record<string, number>,
  perturbDef: Record<string, number>,
  rng: () => number,
  lambdaMap: Record<string, { lH: number; lA: number }> = {},
): { title: Record<string, number>; top4: Record<string, number>; groupAdv: Record<string, number> } {
  const title:    Record<string, number> = {};
  const top4:     Record<string, number> = {};
  const groupAdv: Record<string, number> = {};

  for (let iter = 0; iter < n; iter++) {
    const standings: Record<string, Record<string, SimStandingRow>> = {};
    for (const [g, teams] of Object.entries(groups)) {
      standings[g] = {};
      for (const code of teams) standings[g][code] = { code, pts: 0, gd: 0, gf: 0 };
    }

    for (const m of groupMatches) {
      const known = getResult(m.home, m.away);
      let g1: number, g2: number;
      if (known) {
        [g1, g2] = known;
      } else {
        // Prefer market-corrected lambdas when available; ensemble is fallback.
        // Key is always HOME-AWAY from the schedule — no reversal needed here.
        const ml = lambdaMap[`${m.home}-${m.away}`];
        const { lH, lA } = ml ?? ensembleLambdas(m.home, m.away, perturbAtt, perturbDef);
        g1 = poissonRandom(lH, rng);
        g2 = poissonRandom(lA, rng);
      }
      const h = standings[m.group]?.[m.home];
      const a = standings[m.group]?.[m.away];
      if (!h || !a) continue;
      h.gf += g1; h.gd += g1 - g2;
      a.gf += g2; a.gd += g2 - g1;
      if (g1 > g2) h.pts += 3;
      else if (g2 > g1) a.pts += 3;
      else { h.pts++; a.pts++; }
    }

    const groupRanked: Record<string, string[]> = {};
    const thirdPlaceTeams: SimStandingRow[] = [];
    for (const [g, teamMap] of Object.entries(standings)) {
      const sorted = Object.values(teamMap).sort((a, b) =>
        b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      groupRanked[g] = sorted.map(t => t.code);
      if (sorted[2]) thirdPlaceTeams.push(sorted[2]);
    }

    const r32: string[] = [];
    for (const sorted of Object.values(groupRanked)) {
      if (sorted[0]) { r32.push(sorted[0]); groupAdv[sorted[0]] = (groupAdv[sorted[0]] ?? 0) + 1; }
      if (sorted[1]) { r32.push(sorted[1]); groupAdv[sorted[1]] = (groupAdv[sorted[1]] ?? 0) + 1; }
    }
    for (const code of selectBest8Third(thirdPlaceTeams)) {
      r32.push(code); groupAdv[code] = (groupAdv[code] ?? 0) + 1;
    }

    let currentRound = r32.slice();
    while (currentRound.length < 32) currentRound.push('BYE');

    const semiFinalLosers: string[] = [];
    while (currentRound.length > 2) {
      const next: string[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i];
        const b = currentRound[i + 1] ?? currentRound[i];
        if (!a || !b) continue;
        const winner = simKnockout(a, b, perturbAtt, perturbDef, rng);
        next.push(winner);
        if (currentRound.length === 4) semiFinalLosers.push(winner === a ? b : a);
      }
      currentRound = next;
    }

    const [f1, f2] = currentRound;
    if (f1 && f2) {
      const champion = simKnockout(f1, f2, perturbAtt, perturbDef, rng);
      title[champion] = (title[champion] ?? 0) + 1;
      top4[f1] = (top4[f1] ?? 0) + 1;
      top4[f2] = (top4[f2] ?? 0) + 1;
    }
    for (const loser of semiFinalLosers) top4[loser] = (top4[loser] ?? 0) + 1;
  }
  return { title, top4, groupAdv };
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SimBand = { median: number; low: number; high: number };

export type SimResultWithBands = {
  title:        Record<string, SimBand>;
  top4:         Record<string, SimBand>;
  groupAdvance: Record<string, SimBand>;
  nTournaments: number;
};

// Legacy type for backward compat
export type SimResult = {
  title:        Record<string, number>;
  top4:         Record<string, number>;
  groupAdvance: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Main: simulate with parameter uncertainty (Spec Abschnitt 6, Variante A)
// nParamDraws × nSimsEach = total tournament simulations
// noise: lognormal std for attack/defense perturbation
// ---------------------------------------------------------------------------

export function simulateWithUncertainty(
  resultsMap: Record<string, MatchResult>,
  nParamDraws = 30,
  nSimsEach   = 300,
  noise       = 0.08,
  seed        = 42,
  lambdaMap: Record<string, { lH: number; lA: number }> = {},
): SimResultWithBands {
  const rng = mulberry32(seed);

  // Pre-compute group structure (unchanged per run)
  const groups: Record<string, string[]> = {};
  const groupMatches: Array<{ group: string; home: string; away: string }> = [];
  for (const m of WM_SCHEDULE) {
    if (m.stage !== 'GROUP_STAGE') continue;
    if (m.home === 'TBD' || m.away === 'TBD') continue;
    if (!groups[m.group]) groups[m.group] = [];
    if (!groups[m.group].includes(m.home)) groups[m.group].push(m.home);
    if (!groups[m.group].includes(m.away)) groups[m.group].push(m.away);
    groupMatches.push({ group: m.group, home: m.home, away: m.away });
  }

  function getResult(home: string, away: string): [number, number] | null {
    const res = resultsMap[`${home}-${away}`] ?? resultsMap[`${away}-${home}`];
    if (!res?.finished) return null;
    const homeIsHome = resultsMap[`${home}-${away}`] != null;
    return homeIsHome ? [res.g1, res.g2] : [res.g2, res.g1];
  }

  const teams = Object.keys(NATION_STATS);
  const total = nParamDraws * nSimsEach;

  // Per-draw title/top4/groupAdv probabilities collected for percentile calc
  const titleDraws:    Record<string, number[]> = {};
  const top4Draws:     Record<string, number[]> = {};
  const groupAdvDraws: Record<string, number[]> = {};

  for (let d = 0; d < nParamDraws; d++) {
    // Perturb: att_i *= exp(N(0, noise)), def_i *= exp(N(0, noise))
    const perturbAtt: Record<string, number> = {};
    const perturbDef: Record<string, number> = {};
    for (const t of teams) {
      // Box-Muller for normal distribution from uniform rng
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const u3 = Math.max(1e-10, rng());
      const u4 = rng();
      const z2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);
      perturbAtt[t] = Math.exp(noise * z1);
      perturbDef[t] = Math.exp(noise * z2);
    }

    const { title, top4, groupAdv } = runTournamentBatch(
      nSimsEach, groups, groupMatches, getResult, perturbAtt, perturbDef, rng, lambdaMap,
    );

    for (const t of teams) {
      if (!titleDraws[t])    titleDraws[t]    = [];
      if (!top4Draws[t])     top4Draws[t]     = [];
      if (!groupAdvDraws[t]) groupAdvDraws[t] = [];
      titleDraws[t].push((title[t]    ?? 0) / nSimsEach);
      top4Draws[t].push((top4[t]      ?? 0) / nSimsEach);
      groupAdvDraws[t].push((groupAdv[t] ?? 0) / nSimsEach);
    }
  }

  function toBand(values: number[]): SimBand {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const low    = sorted[Math.floor(n * 0.05)]  ?? 0;
    const high   = sorted[Math.floor(n * 0.95)]  ?? 0;
    const median = sorted[Math.floor(n * 0.50)]  ?? 0;
    return { median, low, high };
  }

  const titleBands:    Record<string, SimBand> = {};
  const top4Bands:     Record<string, SimBand> = {};
  const groupAdvBands: Record<string, SimBand> = {};

  for (const t of teams) {
    titleBands[t]    = toBand(titleDraws[t]    ?? [0]);
    top4Bands[t]     = toBand(top4Draws[t]     ?? [0]);
    groupAdvBands[t] = toBand(groupAdvDraws[t] ?? [0]);
  }

  return {
    title:        titleBands,
    top4:         top4Bands,
    groupAdvance: groupAdvBands,
    nTournaments: total,
  };
}

// ---------------------------------------------------------------------------
// Legacy wrapper (backward compatibility)
// ---------------------------------------------------------------------------

export function runSimulation(
  resultsMap: Record<string, MatchResult>,
  n = 5000,
): SimResult {
  const noPerturb: Record<string, number> = {};
  const rng = mulberry32(42);

  const groups: Record<string, string[]> = {};
  const groupMatches: Array<{ group: string; home: string; away: string }> = [];
  for (const m of WM_SCHEDULE) {
    if (m.stage !== 'GROUP_STAGE') continue;
    if (m.home === 'TBD' || m.away === 'TBD') continue;
    if (!groups[m.group]) groups[m.group] = [];
    if (!groups[m.group].includes(m.home)) groups[m.group].push(m.home);
    if (!groups[m.group].includes(m.away)) groups[m.group].push(m.away);
    groupMatches.push({ group: m.group, home: m.home, away: m.away });
  }

  function getResult(home: string, away: string): [number, number] | null {
    const res = resultsMap[`${home}-${away}`] ?? resultsMap[`${away}-${home}`];
    if (!res?.finished) return null;
    const homeIsHome = resultsMap[`${home}-${away}`] != null;
    return homeIsHome ? [res.g1, res.g2] : [res.g2, res.g1];
  }

  const { title, top4, groupAdv } = runTournamentBatch(
    n, groups, groupMatches, getResult, noPerturb, noPerturb, rng,
  );

  const normTitle: Record<string, number> = {};
  const normTop4:  Record<string, number> = {};
  const normAdv:   Record<string, number> = {};
  for (const [k, v] of Object.entries(title))    normTitle[k] = v / n;
  for (const [k, v] of Object.entries(top4))     normTop4[k]  = v / n;
  for (const [k, v] of Object.entries(groupAdv)) normAdv[k]   = v / n;
  return { title: normTitle, top4: normTop4, groupAdvance: normAdv };
}
