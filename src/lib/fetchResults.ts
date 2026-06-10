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

// Map football-data.org TLA codes to our FIFA codes where they differ
const FD_TLA_MAP: Record<string, string> = {
  // Standard pass-throughs (same code)
  'GER': 'GER', 'BRA': 'BRA', 'FRA': 'FRA', 'ARG': 'ARG',
  'ENG': 'ENG', 'ESP': 'ESP', 'POR': 'POR', 'NED': 'NED',
  'USA': 'USA', 'MEX': 'MEX', 'CAN': 'CAN',
  'KOR': 'KOR', 'JPN': 'JPN', 'AUS': 'AUS',
  'BEL': 'BEL', 'CRO': 'CRO', 'DEN': 'DEN', 'POL': 'POL',
  'SRB': 'SRB', 'SUI': 'SUI', 'TUR': 'TUR', 'URU': 'URU',
  'COL': 'COL', 'ECU': 'ECU', 'PAR': 'PAR', 'CHI': 'CHI',
  'MAR': 'MAR', 'SEN': 'SEN', 'NGA': 'NGA', 'GHA': 'GHA',
  'CMR': 'CMR', 'EGY': 'EGY', 'TUN': 'TUN', 'ALG': 'ALG',
  'IRN': 'IRN', 'SAU': 'SAU', 'JOR': 'JOR', 'IRQ': 'IRQ',
  'QAT': 'QAT', 'UZB': 'UZB',
  'NOR': 'NOR', 'SWE': 'SWE', 'AUT': 'AUT', 'SCO': 'SCO',
  'RSA': 'RSA', 'NZL': 'NZL', 'CPV': 'CPV',
  'PAN': 'PAN', 'HAI': 'HAI',
  'SVN': 'SVN', 'UKR': 'UKR',
  'VEN': 'VEN', 'JAM': 'JAM', 'HON': 'HON',
  // Diverging codes
  'CIV': 'CIV',   // Ivory Coast (fd.org uses CIV)
  'COD': 'COD',   // DR Congo
  'BIH': 'BIH',   // Bosnia
  'CUW': 'CUW',   // Curacao
  // fd.org sometimes uses GBR for England in older datasets, normalise:
  'GBR': 'ENG',
};

function resolveTla(tla: string): string {
  return FD_TLA_MAP[tla] ?? tla;
}

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

function parseGoals(fdMatch: FdMatch, homeCode: string, awayCode: string): GoalEvent[] {
  if (!fdMatch.goals || fdMatch.goals.length === 0) return [];
  return fdMatch.goals.map(g => {
    const isHome = g.team.name === fdMatch.homeTeam.name;
    return {
      minute: g.minute,
      team: isHome ? ('H' as const) : ('A' as const),
      scorer: g.scorer.name,
      type: g.type,
    };
  });
  // suppress unused variable warning — homeCode/awayCode available for future use
  void homeCode; void awayCode;
}

export async function fetchMatchDetail(matchId: number): Promise<MatchResult | null> {
  if (!FD_KEY) return null;
  try {
    const r = await fetch(`${FD_BASE}/matches/${matchId}`, {
      headers: { 'X-Auth-Token': FD_KEY },
    });
    if (!r.ok) return null;
    const m = (await r.json()) as FdMatch;
    const homeCode = resolveTla(m.homeTeam.tla);
    const awayCode = resolveTla(m.awayTeam.tla);
    const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const isFinished = m.status === 'FINISHED' || m.status === 'AWARDED';
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
      goals: parseGoals(m, homeCode, awayCode),
      fdId: m.id,
    };
  } catch {
    return null;
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
      const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
      const isFinished = m.status === 'FINISHED' || m.status === 'AWARDED';
      if (!isLive && !isFinished) continue;

      const homeCode = resolveTla(m.homeTeam.tla);
      const awayCode = resolveTla(m.awayTeam.tla);
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
        fdId: m.id,
      };
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full */ }

    return data;
  } catch {
    return {};
  }
}
