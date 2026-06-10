import { NATION_STATS } from './nations';
import { WM_SCHEDULE } from './schedule';
import type { MatchResult } from './fetchResults';

// ---------------------------------------------------------------------------
// Poisson random draw (Knuth algorithm)
// ---------------------------------------------------------------------------

function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ---------------------------------------------------------------------------
// Effective lambdas for a match (neutral ground)
// ---------------------------------------------------------------------------

function getLambdas(homeCode: string, awayCode: string): { lH: number; lA: number } {
  const h = NATION_STATS[homeCode];
  const a = NATION_STATS[awayCode];
  if (!h || !a) return { lH: 1.0, lA: 1.0 };

  const hAtt = (h.hGF + h.aGF) / 2;
  const hDef = (h.hGA + h.aGA) / 2;
  const aAtt = (a.hGF + a.aGF) / 2;
  const aDef = (a.hGA + a.aGA) / 2;

  const lH = Math.min(4.5, Math.max(0.3, hAtt * aDef));
  const lA = Math.min(4.5, Math.max(0.3, aAtt * hDef));
  return { lH, lA };
}

// ---------------------------------------------------------------------------
// Standing row for simulation
// ---------------------------------------------------------------------------

type SimStandingRow = {
  code: string;
  pts: number;
  gd: number;
  gf: number;
};

// ---------------------------------------------------------------------------
// Simulate a single match, return [g1, g2]
// ---------------------------------------------------------------------------

function simMatch(homeCode: string, awayCode: string): [number, number] {
  const { lH, lA } = getLambdas(homeCode, awayCode);
  return [poissonRandom(lH), poissonRandom(lA)];
}

// ---------------------------------------------------------------------------
// Select best 8 third-place teams from 12 groups
// ---------------------------------------------------------------------------

function selectBest8Third(thirdPlaceTeams: SimStandingRow[]): string[] {
  return thirdPlaceTeams
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .map(t => t.code);
}

// ---------------------------------------------------------------------------
// Simulate a knockout match (returns winner code)
// ---------------------------------------------------------------------------

function simKnockout(home: string, away: string): string {
  const [g1, g2] = simMatch(home, away);
  if (g1 > g2) return home;
  if (g2 > g1) return away;
  // Draw => extra time / penalties: 50/50
  return Math.random() < 0.5 ? home : away;
}

// ---------------------------------------------------------------------------
// Main simulation
// ---------------------------------------------------------------------------

export type SimResult = {
  title: Record<string, number>;
  top4: Record<string, number>;
  groupAdvance: Record<string, number>;
};

export function runSimulation(
  resultsMap: Record<string, MatchResult>,
  n = 5000,
): SimResult {
  const title: Record<string, number> = {};
  const top4: Record<string, number> = {};
  const groupAdvance: Record<string, number> = {};

  // Pre-compute group structure
  const groups: Record<string, string[]> = {};
  const groupMatches: Array<{ id: string; group: string; home: string; away: string }> = [];

  for (const m of WM_SCHEDULE) {
    if (m.stage !== 'GROUP_STAGE') continue;
    if (m.home === 'TBD' || m.away === 'TBD') continue;
    if (!groups[m.group]) groups[m.group] = [];
    if (!groups[m.group].includes(m.home)) groups[m.group].push(m.home);
    if (!groups[m.group].includes(m.away)) groups[m.group].push(m.away);
    groupMatches.push({ id: m.id, group: m.group, home: m.home, away: m.away });
  }

  // Precompute known results
  function getResult(home: string, away: string): [number, number] | null {
    const res = resultsMap[`${home}-${away}`] ?? resultsMap[`${away}-${home}`];
    if (!res || !res.finished) return null;
    const homeIsHome = resultsMap[`${home}-${away}`] != null;
    return homeIsHome ? [res.g1, res.g2] : [res.g2, res.g1];
  }

  for (let iter = 0; iter < n; iter++) {
    // Simulate group stage
    const standings: Record<string, Record<string, SimStandingRow>> = {};
    for (const [g, teams] of Object.entries(groups)) {
      standings[g] = {};
      for (const code of teams) {
        standings[g][code] = { code, pts: 0, gd: 0, gf: 0 };
      }
    }

    for (const m of groupMatches) {
      const known = getResult(m.home, m.away);
      const [g1, g2] = known ?? simMatch(m.home, m.away);

      const h = standings[m.group]?.[m.home];
      const a = standings[m.group]?.[m.away];
      if (!h || !a) continue;

      h.gf += g1; h.gd += g1 - g2;
      a.gf += g2; a.gd += g2 - g1;

      if (g1 > g2) { h.pts += 3; }
      else if (g2 > g1) { a.pts += 3; }
      else { h.pts++; a.pts++; }
    }

    // Determine group rankings
    const groupRanked: Record<string, string[]> = {};
    const thirdPlaceTeams: SimStandingRow[] = [];

    for (const [g, teamMap] of Object.entries(standings)) {
      const sorted = Object.values(teamMap).sort((a, b) =>
        b.pts - a.pts || b.gd - a.gd || b.gf - a.gf,
      );
      groupRanked[g] = sorted.map(t => t.code);
      // 3rd place
      if (sorted[2]) thirdPlaceTeams.push(sorted[2]);
    }

    // Top 2 from each group advance automatically
    const r32Participants: string[] = [];
    for (const sorted of Object.values(groupRanked)) {
      if (sorted[0]) {
        r32Participants.push(sorted[0]);
        groupAdvance[sorted[0]] = (groupAdvance[sorted[0]] ?? 0) + 1;
      }
      if (sorted[1]) {
        r32Participants.push(sorted[1]);
        groupAdvance[sorted[1]] = (groupAdvance[sorted[1]] ?? 0) + 1;
      }
    }

    // Best 8 third-place teams
    const best8Third = selectBest8Third(thirdPlaceTeams);
    for (const code of best8Third) {
      r32Participants.push(code);
      groupAdvance[code] = (groupAdvance[code] ?? 0) + 1;
    }

    // Knockout rounds (simulate bracket with 32 teams)
    // Pair up r32Participants sequentially
    let round = r32Participants.slice();

    // Pad to power of 2 if needed
    while (round.length < 32) round.push(round[0] ?? 'GER');

    // Simulate rounds until final
    const semiFinalLosers: string[] = [];
    let currentRound = round;

    while (currentRound.length > 2) {
      const next: string[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i];
        const b = currentRound[i + 1] ?? currentRound[i];
        if (!a || !b) continue;
        const winner = simKnockout(a, b);
        next.push(winner);
        // Track semi-final losers (4 teams remain before SF)
        if (currentRound.length === 4) {
          const loser = winner === a ? b : a;
          semiFinalLosers.push(loser);
        }
      }
      currentRound = next;
    }

    // Final
    const [f1, f2] = currentRound;
    if (f1 && f2) {
      const champion = simKnockout(f1, f2);
      title[champion] = (title[champion] ?? 0) + 1;
      top4[f1] = (top4[f1] ?? 0) + 1;
      top4[f2] = (top4[f2] ?? 0) + 1;
    }
    for (const loser of semiFinalLosers) {
      top4[loser] = (top4[loser] ?? 0) + 1;
    }
  }

  // Normalize to probabilities
  const normTitle: Record<string, number> = {};
  const normTop4: Record<string, number> = {};
  const normGroupAdv: Record<string, number> = {};

  for (const [k, v] of Object.entries(title)) normTitle[k] = v / n;
  for (const [k, v] of Object.entries(top4)) normTop4[k] = v / n;
  for (const [k, v] of Object.entries(groupAdvance)) normGroupAdv[k] = v / n;

  return { title: normTitle, top4: normTop4, groupAdvance: normGroupAdv };
}
