const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const CACHE_KEY = 'wm_results_v5';
const CACHE_TTL      = 2 * 60 * 1000;
const CACHE_TTL_LIVE = 30 * 1000;

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
  type: 'REGULAR' | 'OWN' | 'PENALTY';
};

export type CardEvent = {
  minute: number;
  team: 'H' | 'A';
  player: string;
  card: 'YELLOW' | 'RED';
};

export type MatchStat = {
  key: string;
  label: string;
  home: number;
  away: number;
};

export type MatchDetail = {
  goals: GoalEvent[];
  cards: CardEvent[];
  stats: MatchStat[];
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
  const isLive     = statusName === 'STATUS_IN_PROGRESS'
    || statusName === 'STATUS_HALFTIME'
    || statusName === 'STATUS_FIRST_HALF'
    || statusName === 'STATUS_SECOND_HALF'
    || statusName === 'STATUS_EXTRA_TIME'
    || statusName === 'STATUS_SHOOTOUT';
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

export async function fetchResults(bypassCache = false): Promise<Record<string, MatchResult>> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && !bypassCache) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<string, MatchResult> };
      const hasLive = Object.values(data).some(d => d.live);
      const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL;
      if (Date.now() - ts < ttl) return data;
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
  type?: { id?: string; text?: string; type?: string };
  participants?: Array<{
    athlete?: { displayName?: string };
    type?: { id?: string };
  }>;
  athletesInvolved?: Array<{ displayName?: string }>;
};

type EspnBoxscoreTeam = {
  team?: { id?: string; abbreviation?: string };
  statistics?: Array<{ name?: string; displayValue?: string; label?: string }>;
};

const STAT_MAP: Record<string, string> = {
  possessionPct:   'Ballbesitz',
  totalShots:      'Schüsse',
  shotsOnTarget:   'Aufs Tor',
  foulsCommitted:  'Fouls',
  wonCorners:      'Ecken',
  offsides:        'Abseits',
};

function parseMinute(displayValue?: string): number {
  if (!displayValue) return 0;
  const clean = displayValue.replace(/[^0-9+]/g, '');
  const parts = clean.split('+');
  return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0);
}

export async function fetchMatchDetail(espnId: string): Promise<MatchDetail | null> {
  if (!espnId) return null;
  try {
    const r = await fetch(`${ESPN_BASE}/summary?event=${espnId}`);
    if (!r.ok) return null;
    const json = await r.json() as {
      header?: {
        competitions?: Array<{
          competitors?: Array<{ homeAway?: string; team?: { id?: string; abbreviation?: string }; score?: string }>;
        }>;
      };
      scoringPlays?: EspnSummaryPlay[];
      keyEvents?: EspnSummaryPlay[];
      boxscore?: { teams?: EspnBoxscoreTeam[] };
    };

    const comp = json.header?.competitions?.[0];
    const homeTeamId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id ?? '';

    // Goals and cards both live in keyEvents
    const keyEvents = json.keyEvents ?? [];

    const goals: GoalEvent[] = keyEvents
      .filter(p => p.scoringPlay)
      .map(p => {
        const minute = parseMinute(p.clock?.displayValue);
        const isHomeGoal = p.team?.id === homeTeamId;
        const scorer = p.participants?.[0]?.athlete?.displayName
          ?? p.athletesInvolved?.[0]?.displayName
          ?? '';
        const typeText = (p.type?.text ?? '').toLowerCase();
        const type: GoalEvent['type'] = typeText.includes('own') ? 'OWN'
          : typeText.includes('penalty') ? 'PENALTY'
          : 'REGULAR';
        return { minute, team: isHomeGoal ? ('H' as const) : ('A' as const), scorer, type };
      });

    const cards: CardEvent[] = keyEvents
      .filter(e => {
        const t = (e.type?.type ?? '').toLowerCase();
        return t === 'yellow-card' || t === 'red-card';
      })
      .map(e => {
        const minute = parseMinute(e.clock?.displayValue);
        const isHome = e.team?.id === homeTeamId;
        const player = e.participants?.[0]?.athlete?.displayName
          ?? e.athletesInvolved?.[0]?.displayName
          ?? '';
        const t = (e.type?.type ?? '').toLowerCase();
        const card: CardEvent['card'] = t === 'red-card' ? 'RED' : 'YELLOW';
        return { minute, team: isHome ? ('H' as const) : ('A' as const), player, card };
      });

    // Stats from boxscore
    const stats: MatchStat[] = [];
    const teams = json.boxscore?.teams ?? [];
    if (teams.length >= 2) {
      const homeTeam = teams.find(t => t.team?.id === homeTeamId) ?? teams[0];
      const awayTeam = teams.find(t => t.team?.id !== homeTeamId) ?? teams[1];

      for (const key of Object.keys(STAT_MAP)) {
        const homeStat = homeTeam.statistics?.find(s => s.name === key);
        const awayStat = awayTeam.statistics?.find(s => s.name === key);
        if (homeStat && awayStat) {
          stats.push({
            key,
            label: STAT_MAP[key],
            home: parseFloat(homeStat.displayValue ?? '0') || 0,
            away: parseFloat(awayStat.displayValue ?? '0') || 0,
          });
        }
      }
    }

    return { goals, cards, stats };
  } catch {
    return null;
  }
}
