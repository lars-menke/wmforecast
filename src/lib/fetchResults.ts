import { fetchWc26Games, WC26_TEAM_MAP } from './fetchWc26';

const FD_BASE   = 'https://api.football-data.org/v4';
const FD_KEY    = import.meta.env.VITE_FD_API_KEY ?? '';
const WC_CODE   = 'WC';
const CACHE_KEY = 'wm_results_v2';
const CACHE_TTL = 3 * 60 * 1000; // 3 min

type FdMatch = {
  id: number;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  homeTeam: { tla: string; name?: string };
  awayTeam: { tla: string; name?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
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
};

function resolveFdCode(tla: string, name?: string): string {
  // Try tla directly
  if (WC26_TEAM_MAP[tla]) return WC26_TEAM_MAP[tla];
  // Try name
  if (name && WC26_TEAM_MAP[name]) return WC26_TEAM_MAP[name];
  // Return tla as fallback
  return tla;
}

async function fetchResultsFallback(): Promise<Record<string, MatchResult>> {
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
      const isLive = m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'PAUSED';
      const isFinished = m.status === 'FINISHED';
      if (!isLive && !isFinished) continue;

      const homeCode = resolveFdCode(m.homeTeam.tla, m.homeTeam.name);
      const awayCode = resolveFdCode(m.awayTeam.tla, m.awayTeam.name);
      const key = `${homeCode}-${awayCode}`;

      const g1 = m.score.fullTime.home ?? 0;
      const g2 = m.score.fullTime.away ?? 0;

      data[key] = {
        homeCode,
        awayCode,
        g1: isFinished ? g1 : 0,
        g2: isFinished ? g2 : 0,
        finished: isFinished,
        live: isLive,
        ...(isLive ? { g1Live: g1, g2Live: g2 } : {}),
      };
    }

    return data;
  } catch {
    return {};
  }
}

export async function fetchResults(): Promise<Record<string, MatchResult>> {
  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<string, MatchResult> };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  // Try worldcup26.ir first
  let data: Record<string, MatchResult> = {};

  const wc26Games = await fetchWc26Games();
  if (wc26Games.length > 0) {
    for (const g of wc26Games) {
      const key = `${g.homeCode}-${g.awayCode}`;
      data[key] = {
        homeCode: g.homeCode,
        awayCode: g.awayCode,
        g1: g.g1,
        g2: g.g2,
        finished: g.finished,
        live: g.live,
        ...(g.live ? { g1Live: g.g1Live, g2Live: g.g2Live } : {}),
      };
    }
  } else {
    // Fall back to football-data.org
    data = await fetchResultsFallback();
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* storage full */ }

  return data;
}
