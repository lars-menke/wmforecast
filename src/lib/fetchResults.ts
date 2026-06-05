const FD_BASE  = 'https://api.football-data.org/v4';
const FD_KEY   = import.meta.env.VITE_FD_API_KEY ?? '';
const WC_CODE  = 'WC';
const CACHE_KEY = 'wm_results_v1';
const CACHE_TTL = 3 * 60 * 1000; // 3 Minuten

type FdMatch = {
  id: number;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

export type MatchResult = {
  apiId: number;
  g1: number;
  g2: number;
  finished: boolean;
};

export async function fetchResults(): Promise<Record<number, MatchResult>> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<number, MatchResult> };
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
    const data: Record<number, MatchResult> = {};

    for (const m of matches) {
      if (m.status !== 'FINISHED') continue;
      data[m.id] = {
        apiId: m.id,
        g1: m.score.fullTime.home ?? 0,
        g2: m.score.fullTime.away ?? 0,
        finished: true,
      };
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage voll */ }

    return data;
  } catch {
    return {};
  }
}
