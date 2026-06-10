import { resolveTla } from './fdUtils';

const FD_BASE   = 'https://api.football-data.org/v4';
const FD_KEY    = import.meta.env.VITE_FD_API_KEY ?? '';
const WC_CODE   = 'WC';
const CACHE_KEY = 'wm_scorers_v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 min

type FdScorerEntry = {
  player: { id: number; name: string };
  team: { id: number; name: string; shortName: string; tla: string; crest: string };
  goals: number;
  assists: number | null;
  penalties: number | null;
};

type FdScorersResponse = {
  scorers: FdScorerEntry[];
};

export type TopScorer = {
  playerName: string;
  teamCode: string;
  goals: number;
  assists: number;
  penalties: number;
};

export async function fetchTopScorers(): Promise<TopScorer[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: TopScorer[] };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  if (!FD_KEY) return [];

  try {
    const r = await fetch(
      `${FD_BASE}/competitions/${WC_CODE}/scorers?limit=20`,
      { headers: { 'X-Auth-Token': FD_KEY } },
    );
    if (!r.ok) return [];

    const { scorers } = (await r.json()) as FdScorersResponse;

    const data: TopScorer[] = scorers.map(s => ({
      playerName: s.player.name,
      teamCode: resolveTla(s.team.tla),
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
    }));

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full */ }

    return data;
  } catch {
    return [];
  }
}
