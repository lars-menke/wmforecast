const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const CACHE_KEY = 'wm_results_v5';
const CACHE_TTL = 2 * 60 * 1000;

// WM 2026: 11 Jun – 19 Jul
const WM_DATE_RANGE = '20260611-20260719';

type EspnCompetitor = {
  homeAway: 'home' | 'away';
  score: string;
  team: { abbreviation: string; displayName: string; id: string };
};

type EspnEvent = {
  id: string;
  date: string;
  status: {
    type: { name: string; completed: boolean };
  };
  competitions: Array<{
    competitors: EspnCompetitor[];
    details?: Array<{
      type?: { text?: string };
      clock?: { displayValue?: string };
      team?: { id?: string };
      athletesInvolved?: Array<{ displayName?: string }>;
      scoringPlay?: boolean;
    }>;
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
  espnId?: string;
};

function parseGoalsFromDetails(
  details: EspnEvent['competitions'][0]['details'],
  homeTeamId: string,
): GoalEvent[] {
  if (!details?.length) return [];
  const goals: GoalEvent[] = [];
  for (const d of details) {
    if (!d.scoringPlay) continue;
    const clockStr = d.clock?.displayValue ?? '0:00';
    const [minStr] = clockStr.split(':');
    const minute = parseInt(minStr, 10) || 0;
    const isHome = d.team?.id === homeTeamId;
    const scorer = d.athletesInvolved?.[0]?.displayName ?? '';
    const typeText = d.type?.text ?? '';
    const type = typeText.toLowerCase().includes('own') ? 'OWN'
      : typeText.toLowerCase().includes('penalty') ? 'PENALTY'
      : 'REGULAR';
    goals.push({ minute, team: isHome ? 'H' : 'A', scorer, type });
  }
  return goals;
}

function eventToResult(event: EspnEvent): MatchResult | null {
  const statusName = event.status.type.name;
  const isLive     = statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME';
  const isFinished = event.status.type.completed || statusName === 'STATUS_FINAL' || statusName === 'STATUS_FULL_TIME';
  if (!isLive && !isFinished) return null;

  const comp = event.competitions[0];
  if (!comp?.competitors?.length) return null;

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  const homeCode = home.team.abbreviation;
  const awayCode = away.team.abbreviation;
  const g1 = parseInt(home.score, 10) || 0;
  const g2 = parseInt(away.score, 10) || 0;
  const goals = parseGoalsFromDetails(comp.details, home.team.id);

  return {
    homeCode,
    awayCode,
    g1: isFinished ? g1 : 0,
    g2: isFinished ? g2 : 0,
    finished: isFinished,
    live: isLive,
    ...(isLive ? { g1Live: g1, g2Live: g2 } : {}),
    goals,
    espnId: event.id,
  };
}

function parseEvents(events: EspnEvent[]): Record<string, MatchResult> {
  const data: Record<string, MatchResult> = {};
  for (const e of events) {
    const result = eventToResult(e);
    if (!result) continue;
    data[`${result.homeCode}-${result.awayCode}`] = result;
  }
  return data;
}

export async function fetchResults(): Promise<Record<string, MatchResult>> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<string, MatchResult> };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(`${ESPN_BASE}/scoreboard?dates=${WM_DATE_RANGE}&limit=200`);
    if (!r.ok) return {};
    const { events } = (await r.json()) as { events: EspnEvent[] };
    if (!Array.isArray(events)) return {};

    const data = parseEvents(events);

    if (Object.keys(data).length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch { /* storage full */ }
    }
    return data;
  } catch {
    return {};
  }
}

type EspnSummaryPlay = {
  scoringPlay?: boolean;
  clock?: { displayValue?: string };
  team?: { id?: string };
  type?: { text?: string };
  participants?: Array<{
    athlete?: { displayName?: string };
    type?: { id?: string };
  }>;
};

export async function fetchMatchDetail(espnId: string): Promise<MatchResult | null> {
  if (!espnId) return null;
  try {
    const r = await fetch(`${ESPN_BASE}/summary?event=${espnId}`);
    if (!r.ok) return null;
    const json = await r.json() as {
      header?: {
        competitions?: Array<{
          competitors?: Array<{ homeAway?: string; team?: { id?: string; abbreviation?: string }; score?: string }>;
          status?: { type?: { name?: string; completed?: boolean } };
        }>;
      };
      scoringPlays?: EspnSummaryPlay[];
    };

    const comp = json.header?.competitions?.[0];
    if (!comp) return null;

    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    if (!home || !away) return null;

    const statusName = comp.status?.type?.name ?? '';
    const isLive     = statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME';
    const isFinished = comp.status?.type?.completed || statusName === 'STATUS_FINAL';

    const g1 = parseInt(home.score ?? '0', 10) || 0;
    const g2 = parseInt(away.score ?? '0', 10) || 0;
    const homeTeamId = home.team?.id ?? '';

    const goals: GoalEvent[] = (json.scoringPlays ?? [])
      .filter(p => p.scoringPlay)
      .map(p => {
        const clockStr = p.clock?.displayValue ?? '0:00';
        const minute = parseInt(clockStr.split(':')[0], 10) || 0;
        const isHomeGoal = p.team?.id === homeTeamId;
        const scorer = p.participants?.find(pa => pa.type?.id === 'scorer')?.athlete?.displayName
          ?? p.participants?.[0]?.athlete?.displayName
          ?? '';
        const typeText = p.type?.text ?? '';
        const type = typeText.toLowerCase().includes('own') ? 'OWN'
          : typeText.toLowerCase().includes('penalty') ? 'PENALTY'
          : 'REGULAR';
        return { minute, team: isHomeGoal ? ('H' as const) : ('A' as const), scorer, type };
      });

    return {
      homeCode: home.team?.abbreviation ?? '',
      awayCode: away.team?.abbreviation ?? '',
      g1: isFinished ? g1 : 0,
      g2: isFinished ? g2 : 0,
      finished: !!isFinished,
      live: isLive,
      ...(isLive ? { g1Live: g1, g2Live: g2 } : {}),
      goals,
      espnId,
    };
  } catch {
    return null;
  }
}
