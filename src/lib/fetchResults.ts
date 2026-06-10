import { resolveTla } from './fdUtils';

const FD_BASE   = 'https://api.football-data.org/v4';
const FD_KEY    = import.meta.env.VITE_FD_API_KEY ?? '';
const WC_CODE   = 'WC';
const CACHE_KEY = 'wm_results_v3';
const CACHE_TTL = 3 * 60 * 1000; // 3 min

type FdMatch = {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  goals: Array<{
    minute: number;
    injuryTime?: number | null;
    type: 'REGULAR' | 'OWN' | 'PENALTY';
    team: { id: number; name: string };
    scorer: { id: number; name: string };
    assist: { id: number; name: string } | null;
  }>;
};

export type GoalEvent = {
  minute: number;
  team: 'H' | 'A';
  scorer: string;
  type: string;
};

export type MatchResult = {
  homeCode: string;
  awayCode: string;
  g1: number;
  g2: number;
  finished: boolean;
  live: boolean;
  g1Live?: number;
  g2Live?: number;
  goals?: GoalEvent[];
  fdId?: number;
};

function parseGoals(fdMatch: FdMatch): GoalEvent[] {
  if (!fdMatch.goals || fdMatch.goals.length === 0) return [];
  return fdMatch.goals.map(g => ({
    minute: g.minute,
    team: g.team.name === fdMatch.homeTeam.name ? ('H' as const) : ('A' as const),
    scorer: g.scorer.name,
    type: g.type,
  }));
}

function matchToResult(m: FdMatch): MatchResult | null {
  const isLive     = m.status === 'IN_PLAY' || m.status === 'PAUSED';
  const isFinished = m.status === 'FINISHED' || m.status === 'AWARDED';
  if (!isLive && !isFinished) return null;

  const homeCode = resolveTla(m.homeTeam.tla);
  const awayCode = resolveTla(m.awayTeam.tla);
  const g1 = m.score.fullTime.home ?? 0;
  const g2 = m.score.fullTime.away ?? 0;

  return {
    homeCode,
    awayCode,
    g1: isFinished ? g1 : 0,
    g2: isFinished ? g2 : 0,
    finished: isFinished,
    live: isLive,
    ...(isLive ? { g1Live: g1, g2Live: g2 } : {}),
    goals: parseGoals(m),
    fdId: m.id,
  };
}

export async function fetchMatchDetail(matchId: number): Promise<MatchResult | null> {
  if (!FD_KEY) return null;
  try {
    const r = await fetch(`${FD_BASE}/matches/${matchId}`, {
      headers: { 'X-Auth-Token': FD_KEY },
    });
    if (!r.ok) return null;
    return matchToResult((await r.json()) as FdMatch);
  } catch {
    return null;
  }
}

export async function fetchResults(): Promise<Record<string, MatchResult>> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<string, MatchResult> };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  if (!FD_KEY) return {};

  try {
    const r = await fetch(
      `${FD_BASE}/competitions/${WC_CODE}/matches`,
      { headers: { 'X-Auth-Token': FD_KEY } },
    );
    if (!r.ok) return {};

    const { matches } = (await r.json()) as { matches: FdMatch[] };
    const data: Record<string, MatchResult> = {};

    for (const m of matches) {
      const result = matchToResult(m);
      if (!result) continue;
      data[`${result.homeCode}-${result.awayCode}`] = result;
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full */ }

    return data;
  } catch {
    return {};
  }
}
