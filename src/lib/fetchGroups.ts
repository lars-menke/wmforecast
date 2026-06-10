import { WC26_TEAM_MAP } from './fetchWc26';
import { WM_SCHEDULE } from './schedule';
import type { MatchResult } from './fetchResults';

const WC26_BASE   = 'https://worldcup26.ir';
const WC26_TOKEN  = import.meta.env.VITE_WC26_TOKEN ?? '';
const CACHE_KEY   = 'wm_groups_v1';
const CACHE_TTL   = 5 * 60 * 1000; // 5 min

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

// Loosely typed API response
type Wc26Group = {
  name?: string;
  group?: string;
  letter?: string;
  teams?: unknown[];
  standings?: unknown[];
  [key: string]: unknown;
};

type Wc26TeamStanding = {
  team?: string | { name?: string; code?: string };
  name?: string;
  code?: string;
  played?: number;
  mp?: number;
  won?: number;
  w?: number;
  drawn?: number;
  d?: number;
  lost?: number;
  l?: number;
  gf?: number;
  goals_for?: number;
  ga?: number;
  goals_against?: number;
  gd?: number;
  goal_difference?: number;
  pts?: number;
  points?: number;
  [key: string]: unknown;
};

function resolveGroupLetter(raw: Wc26Group): string | null {
  const candidates = [raw.name, raw.group, raw.letter];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const m = c.match(/[A-L]/i);
      if (m) return m[0].toUpperCase();
    }
  }
  return null;
}

function resolveTeamCode(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return WC26_TEAM_MAP[raw] ?? WC26_TEAM_MAP[raw.trim()] ?? null;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const code = typeof obj.code === 'string' ? obj.code : null;
    const name = typeof obj.name === 'string' ? obj.name : null;
    if (code && WC26_TEAM_MAP[code]) return WC26_TEAM_MAP[code];
    if (name && WC26_TEAM_MAP[name]) return WC26_TEAM_MAP[name];
  }
  return null;
}

function parseStandingRow(raw: unknown): StandingRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Wc26TeamStanding;

  const code = resolveTeamCode(s.team ?? s.name ?? s.code);
  if (!code) return null;

  const played = s.played ?? s.mp ?? 0;
  const won    = s.won ?? s.w ?? 0;
  const drawn  = s.drawn ?? s.d ?? 0;
  const lost   = s.lost ?? s.l ?? 0;
  const gf     = s.gf ?? s.goals_for ?? 0;
  const ga     = s.ga ?? s.goals_against ?? 0;
  const gd     = s.gd ?? s.goal_difference ?? (gf - ga);
  const pts    = s.pts ?? s.points ?? (won * 3 + drawn);

  return {
    code,
    played: Number(played),
    won: Number(won),
    drawn: Number(drawn),
    lost: Number(lost),
    gf: Number(gf),
    ga: Number(ga),
    gd: Number(gd),
    pts: Number(pts),
  };
}

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
  if (!WC26_TOKEN) return {};

  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: GroupStandings };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(`${WC26_BASE}/get/groups`, {
      headers: { Authorization: `Bearer ${WC26_TOKEN}` },
    });
    if (!r.ok) return {};

    const json: unknown = await r.json();

    // API may return { groups: [...] } or [...]
    let groupList: unknown[] = [];
    if (Array.isArray(json)) {
      groupList = json;
    } else if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>;
      const key = ['groups', 'data', 'standings'].find(k => Array.isArray(obj[k]));
      if (key) groupList = obj[key] as unknown[];
    }

    const result: GroupStandings = {};

    for (const rawGroup of groupList) {
      if (!rawGroup || typeof rawGroup !== 'object') continue;
      const g = rawGroup as Wc26Group;
      const letter = resolveGroupLetter(g);
      if (!letter) continue;

      // Teams may be in .teams or .standings
      const teamList: unknown[] = Array.isArray(g.teams)
        ? g.teams
        : Array.isArray(g.standings)
          ? g.standings
          : [];

      const rows: StandingRow[] = [];
      for (const t of teamList) {
        const row = parseStandingRow(t);
        if (row) rows.push(row);
      }

      if (rows.length > 0) {
        result[letter] = rows.sort((a, b) =>
          b.pts - a.pts || b.gd - a.gd || b.gf - a.gf,
        );
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
