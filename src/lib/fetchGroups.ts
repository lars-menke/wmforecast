import { WM_SCHEDULE } from './schedule';
import type { MatchResult } from './fetchResults';
import { resolveTla } from './fdUtils';

const FD_BASE   = 'https://api.football-data.org/v4';
const FD_KEY    = import.meta.env.VITE_FD_API_KEY ?? '';
const WC_CODE   = 'WC';
const CACHE_KEY = 'wm_standings_v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export type StandingRow = {
  code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type GroupStandings = Record<string, StandingRow[]>; // key = group letter "A"-"L"

// football-data.org group string "GROUP_A" -> "A"
function resolveGroupLetter(group: string): string | null {
  const m = group.match(/GROUP_([A-L])/i);
  if (m) return m[1].toUpperCase();
  // Also handle bare "A"-"L"
  const bare = group.trim().toUpperCase();
  if (/^[A-L]$/.test(bare)) return bare;
  return null;
}

type FdStandingRow = {
  position: number;
  team: { id: number; name: string; shortName: string; tla: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type FdStandingGroup = {
  stage: string;
  type: string;
  group: string;
  table: FdStandingRow[];
};

type FdStandingsResponse = {
  standings: FdStandingGroup[];
};

export function computeStandings(resultsMap: Record<string, MatchResult>): GroupStandings {
  // Build standings from WM_SCHEDULE + resultsMap
  const standings: Record<string, Record<string, StandingRow>> = {};

  // Initialize all group teams
  for (const m of WM_SCHEDULE) {
    if (m.stage !== 'GROUP_STAGE') continue;
    if (m.home === 'TBD' || m.away === 'TBD') continue;
    const g = m.group;
    if (!standings[g]) standings[g] = {};
    for (const code of [m.home, m.away]) {
      if (!standings[g][code]) {
        standings[g][code] = { code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      }
    }
  }

  // Apply finished results
  for (const m of WM_SCHEDULE) {
    if (m.stage !== 'GROUP_STAGE') continue;
    if (m.home === 'TBD' || m.away === 'TBD') continue;
    const res = resultsMap[`${m.home}-${m.away}`] ?? resultsMap[`${m.away}-${m.home}`];
    if (!res || !res.finished) continue;

    const g = m.group;
    // Determine actual home/away from match perspective
    const homeIsHome = resultsMap[`${m.home}-${m.away}`] != null;
    const g1 = homeIsHome ? res.g1 : res.g2;
    const g2 = homeIsHome ? res.g2 : res.g1;

    const home = standings[g]?.[m.home];
    const away = standings[g]?.[m.away];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += g1; home.ga += g2; home.gd = home.gf - home.ga;
    away.gf += g2; away.ga += g1; away.gd = away.gf - away.ga;

    if (g1 > g2) {
      home.won++; home.pts += 3;
      away.lost++;
    } else if (g1 < g2) {
      away.won++; away.pts += 3;
      home.lost++;
    } else {
      home.drawn++; home.pts++;
      away.drawn++; away.pts++;
    }
  }

  // Sort each group: pts desc, gd desc, gf desc
  const result: GroupStandings = {};
  for (const [g, teamMap] of Object.entries(standings)) {
    result[g] = Object.values(teamMap).sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf,
    );
  }
  return result;
}

export async function fetchGroups(): Promise<GroupStandings> {
  if (!FD_KEY) return {};

  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: GroupStandings };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(
      `${FD_BASE}/competitions/${WC_CODE}/standings`,
      { headers: { 'X-Auth-Token': FD_KEY } },
    );
    if (!r.ok) return {};

    const json = (await r.json()) as FdStandingsResponse;
    const result: GroupStandings = {};

    for (const sg of json.standings) {
      if (sg.type !== 'TOTAL') continue;
      const letter = resolveGroupLetter(sg.group);
      if (!letter) continue;

      const rows: StandingRow[] = sg.table.map(row => ({
        code: resolveTla(row.team.tla),
        played: row.playedGames,
        won: row.won,
        drawn: row.draw,
        lost: row.lost,
        gf: row.goalsFor,
        ga: row.goalsAgainst,
        gd: row.goalDifference,
        pts: row.points,
      }));

      if (rows.length > 0) {
        result[letter] = rows; // already sorted by fd.org
      }
    }

    if (Object.keys(result).length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }));
      } catch { /* storage full */ }
      return result;
    }

    return {};
  } catch {
    return {};
  }
}
