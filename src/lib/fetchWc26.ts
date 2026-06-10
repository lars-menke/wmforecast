import type { WmMatch, WmStage } from './schedule';

const WC26_BASE = 'https://worldcup26.ir';
const WC26_TOKEN = import.meta.env.VITE_WC26_TOKEN ?? '';

const CACHE_KEY          = 'wm_wc26_v1';
const CACHE_KEY_SCHEDULE = 'wm_wc26_schedule_v1';
const CACHE_TTL_LIVE     = 30 * 1000;          // 30s for live matches
const CACHE_TTL_FINISHED = 3 * 60 * 1000;      // 3 min standard
const CACHE_TTL_SCHEDULE = 60 * 60 * 1000;     // 1h for schedule

// Unknown API response — typed loosely, with safe property access
type Wc26Game = {
  id?: number;
  home_team?: string | { name?: string; code?: string; id?: number };
  away_team?: string | { name?: string; code?: string; id?: number };
  home_score?: number | null;
  away_score?: number | null;
  status?: string;
  date?: string;
  time?: string;
  datetime?: string;
  kickoff?: string;
  start_time?: string;
  utc_date?: string;
  group?: string | { name?: string; code?: string };
  stage?: string | { name?: string; code?: string };
  round?: string | { name?: string; code?: string };
  [key: string]: unknown;
};

// Comprehensive team name -> FIFA code mapping for all 48 WM 2026 teams
export const WC26_TEAM_MAP: Record<string, string> = {
  // Mexico
  'Mexico': 'MEX', 'México': 'MEX', 'MEX': 'MEX',
  // South Korea
  'South Korea': 'KOR', 'Korea Republic': 'KOR', 'Korea DPR': 'KOR', 'KOR': 'KOR',
  // South Africa
  'South Africa': 'RSA', 'RSA': 'RSA',
  // Czech Republic
  'Czech Republic': 'CZE', 'Czechia': 'CZE', 'CZE': 'CZE',
  // Canada
  'Canada': 'CAN', 'CAN': 'CAN',
  // Qatar
  'Qatar': 'QAT', 'QAT': 'QAT',
  // Bosnia and Herzegovina
  'Bosnia and Herzegovina': 'BIH', 'Bosnia-Herzegovina': 'BIH', 'Bosnia & Herzegovina': 'BIH', 'BIH': 'BIH',
  // Switzerland
  'Switzerland': 'SUI', 'SUI': 'SUI',
  // Brazil
  'Brazil': 'BRA', 'Brasil': 'BRA', 'BRA': 'BRA',
  // Morocco
  'Morocco': 'MAR', 'Maroc': 'MAR', 'MAR': 'MAR',
  // Haiti
  'Haiti': 'HAI', 'HAI': 'HAI',
  // Scotland
  'Scotland': 'SCO', 'SCO': 'SCO',
  // United States
  'United States': 'USA', 'USA': 'USA', 'United States of America': 'USA', 'US': 'USA',
  // Paraguay
  'Paraguay': 'PAR', 'PAR': 'PAR',
  // Australia
  'Australia': 'AUS', 'AUS': 'AUS',
  // Turkey
  'Turkey': 'TUR', 'Türkiye': 'TUR', 'TUR': 'TUR',
  // Germany
  'Germany': 'GER', 'Deutschland': 'GER', 'GER': 'GER',
  // Curacao
  'Curaçao': 'CUW', 'Curacao': 'CUW', 'CUW': 'CUW',
  // Ivory Coast
  'Ivory Coast': 'CIV', 'Côte d\'Ivoire': 'CIV', 'Cote d\'Ivoire': 'CIV', 'CIV': 'CIV',
  // Ecuador
  'Ecuador': 'ECU', 'ECU': 'ECU',
  // Netherlands
  'Netherlands': 'NED', 'Holland': 'NED', 'NED': 'NED',
  // Japan
  'Japan': 'JPN', 'JPN': 'JPN',
  // Sweden
  'Sweden': 'SWE', 'SWE': 'SWE',
  // Tunisia
  'Tunisia': 'TUN', 'TUN': 'TUN',
  // Belgium
  'Belgium': 'BEL', 'BEL': 'BEL',
  // Egypt
  'Egypt': 'EGY', 'EGY': 'EGY',
  // Iran
  'Iran': 'IRN', 'IR Iran': 'IRN', 'IRN': 'IRN',
  // New Zealand
  'New Zealand': 'NZL', 'NZL': 'NZL',
  // Spain
  'Spain': 'ESP', 'ESP': 'ESP',
  // Cape Verde
  'Cape Verde': 'CPV', 'Cabo Verde': 'CPV', 'CPV': 'CPV',
  // Saudi Arabia
  'Saudi Arabia': 'SAU', 'SAU': 'SAU',
  // Uruguay
  'Uruguay': 'URU', 'URU': 'URU',
  // France
  'France': 'FRA', 'FRA': 'FRA',
  // Senegal
  'Senegal': 'SEN', 'SEN': 'SEN',
  // Iraq
  'Iraq': 'IRQ', 'IRQ': 'IRQ',
  // Norway
  'Norway': 'NOR', 'NOR': 'NOR',
  // Argentina
  'Argentina': 'ARG', 'ARG': 'ARG',
  // Algeria
  'Algeria': 'ALG', 'ALG': 'ALG',
  // Austria
  'Austria': 'AUT', 'AUT': 'AUT',
  // Jordan
  'Jordan': 'JOR', 'JOR': 'JOR',
  // Portugal
  'Portugal': 'POR', 'POR': 'POR',
  // DR Congo
  'DR Congo': 'COD', 'Congo DR': 'COD', 'Democratic Republic of Congo': 'COD', 'Democratic Republic of the Congo': 'COD', 'COD': 'COD',
  // Uzbekistan
  'Uzbekistan': 'UZB', 'UZB': 'UZB',
  // Colombia
  'Colombia': 'COL', 'COL': 'COL',
  // England
  'England': 'ENG', 'ENG': 'ENG',
  // Croatia
  'Croatia': 'CRO', 'CRO': 'CRO',
  // Ghana
  'Ghana': 'GHA', 'GHA': 'GHA',
  // Panama
  'Panama': 'PAN', 'PAN': 'PAN',
  // Additional teams that may appear
  'Venezuela': 'VEN', 'VEN': 'VEN',
  'Jamaica': 'JAM', 'JAM': 'JAM',
  'Honduras': 'HON', 'HON': 'HON',
  'Denmark': 'DEN', 'DEN': 'DEN',
  'Poland': 'POL', 'POL': 'POL',
  'Serbia': 'SRB', 'SRB': 'SRB',
  'Slovenia': 'SVN', 'SVN': 'SVN',
  'Ukraine': 'UKR', 'UKR': 'UKR',
  'Nigeria': 'NGA', 'NGA': 'NGA',
  'Cameroon': 'CMR', 'CMR': 'CMR',
};

function resolveTeamName(raw: string | { name?: string; code?: string } | undefined): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return WC26_TEAM_MAP[raw] ?? WC26_TEAM_MAP[raw.trim()] ?? null;
  }
  // object form
  const code = raw.code;
  const name = raw.name;
  if (code && WC26_TEAM_MAP[code]) return WC26_TEAM_MAP[code];
  if (name && WC26_TEAM_MAP[name]) return WC26_TEAM_MAP[name];
  if (name) return WC26_TEAM_MAP[name.trim()] ?? null;
  return null;
}

function isLiveStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'live' || s === 'in_play' || s === 'in play' || s === 'playing' || s === 'paused';
}

function isFinishedStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'finished' || s === 'completed' || s === 'ft' || s === 'full_time';
}

export type Wc26MatchResult = {
  homeCode: string;
  awayCode: string;
  g1: number;
  g2: number;
  finished: boolean;
  live: boolean;
  g1Live?: number;
  g2Live?: number;
};

// ---------------------------------------------------------------------------
// Schedule helpers
// ---------------------------------------------------------------------------

const GROUP_NAME_MAP: Record<string, string> = {
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
  'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L',
  'Group A': 'A', 'Group B': 'B', 'Group C': 'C', 'Group D': 'D',
  'Group E': 'E', 'Group F': 'F', 'Group G': 'G', 'Group H': 'H',
  'Group I': 'I', 'Group J': 'J', 'Group K': 'K', 'Group L': 'L',
  'GROUP_A': 'A', 'GROUP_B': 'B', 'GROUP_C': 'C', 'GROUP_D': 'D',
  'GROUP_E': 'E', 'GROUP_F': 'F', 'GROUP_G': 'G', 'GROUP_H': 'H',
  'GROUP_I': 'I', 'GROUP_J': 'J', 'GROUP_K': 'K', 'GROUP_L': 'L',
};

function resolveGroup(raw: string | { name?: string; code?: string } | undefined): string {
  if (!raw) return 'R32';
  const s = typeof raw === 'string' ? raw : (raw.code ?? raw.name ?? '');
  return GROUP_NAME_MAP[s] ?? GROUP_NAME_MAP[s.trim()] ?? 'R32';
}

function resolveStage(raw: string | { name?: string; code?: string } | undefined, group: string): WmStage {
  const s = typeof raw === 'string' ? raw : (raw ? (raw.code ?? raw.name ?? '') : '');
  const lo = s.toLowerCase().replace(/[-_ ]/g, '');

  if (!s || group.length === 1) return 'GROUP_STAGE';
  if (lo.includes('roundof32') || lo === 'r32' || lo.includes('last32') || lo.includes('roundofsixteenone') || lo === '32') return 'ROUND_OF_32';
  if (lo.includes('roundof16') || lo.includes('sixteens') || lo === 'r16' || lo === '16') return 'ROUND_OF_16';
  if (lo.includes('quarter') || lo === 'qf') return 'QUARTER_FINALS';
  if (lo.includes('semi') || lo === 'sf') return 'SEMI_FINALS';
  if (lo.includes('third') || lo.includes('place') || lo === '3rd') return 'THIRD_PLACE';
  if (lo.includes('final')) return 'FINAL';
  return 'GROUP_STAGE';
}

function resolveKickoff(g: Wc26Game): string {
  // Try various field names the API might use
  const raw = g.utc_date ?? g.datetime ?? g.kickoff ?? g.start_time;
  if (raw && typeof raw === 'string') {
    // Already ISO? Return as-is (ensure Z suffix)
    if (raw.includes('T')) return raw.endsWith('Z') ? raw : raw + 'Z';
    // "2026-06-11 19:00:00" format
    if (raw.includes(' ') && raw.includes('-')) return raw.replace(' ', 'T') + 'Z';
  }
  // Separate date + time fields
  const date = g.date;
  const time = g.time;
  if (date && typeof date === 'string' && time && typeof time === 'string') {
    const d = date.includes('T') ? date.split('T')[0] : date;
    const t = time.length === 5 ? time + ':00' : time;
    return `${d}T${t}Z`;
  }
  return '2026-01-01T00:00:00Z'; // fallback placeholder
}

export type Wc26ScheduleMatch = Omit<WmMatch, 'apiId'> & { wc26Id: number };

async function fetchGamesRaw(): Promise<Wc26Game[]> {
  const r = await fetch(`${WC26_BASE}/get/games`, {
    headers: { Authorization: `Bearer ${WC26_TOKEN}` },
  });
  if (!r.ok) return [];
  const json: unknown = await r.json();

  if (Array.isArray(json)) return json as Wc26Game[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const key = ['games', 'matches', 'data', 'results'].find(k => Array.isArray(obj[k]));
    if (key) return obj[key] as Wc26Game[];
  }
  return [];
}

export async function fetchWc26Schedule(): Promise<Wc26ScheduleMatch[]> {
  if (!WC26_TOKEN) return [];

  try {
    const cached = localStorage.getItem(CACHE_KEY_SCHEDULE);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Wc26ScheduleMatch[] };
      if (Date.now() - ts < CACHE_TTL_SCHEDULE) return data;
    }
  } catch { /* ignore */ }

  try {
    const games = await fetchGamesRaw();
    const results: Wc26ScheduleMatch[] = [];
    let idx = 0;

    for (const g of games) {
      if (!g || typeof g !== 'object') continue;

      const homeCode = resolveTeamName(g.home_team);
      const awayCode = resolveTeamName(g.away_team);
      // Allow TBD for knockout slots
      const home = homeCode ?? 'TBD';
      const away = awayCode ?? 'TBD';

      const kickoff = resolveKickoff(g);
      const group = resolveGroup(g.group);
      const stageRaw = g.stage ?? g.round;
      const stage = resolveStage(stageRaw, group);

      // Generate a stable id
      const id = (home !== 'TBD' && away !== 'TBD')
        ? `${home}-${away}-${group}`
        : `KO-${String(++idx).padStart(3, '0')}`;

      results.push({
        id,
        wc26Id: typeof g.id === 'number' ? g.id : 0,
        group,
        stage,
        home,
        away,
        kickoff,
      });
    }

    if (results.length > 10) {
      try {
        localStorage.setItem(CACHE_KEY_SCHEDULE, JSON.stringify({ ts: Date.now(), data: results }));
      } catch { /* storage full */ }
    }

    return results;
  } catch {
    return [];
  }
}

export async function fetchWc26Games(): Promise<Wc26MatchResult[]> {
  if (!WC26_TOKEN) return [];

  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data, hasLive } = JSON.parse(cached) as { ts: number; data: Wc26MatchResult[]; hasLive: boolean };
      const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL_FINISHED;
      if (Date.now() - ts < ttl) return data;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(`${WC26_BASE}/get/games`, {
      headers: { Authorization: `Bearer ${WC26_TOKEN}` },
    });
    if (!r.ok) return [];

    const json: unknown = await r.json();

    // API may return { games: [...] } or just [...]
    let games: unknown[] = [];
    if (Array.isArray(json)) {
      games = json;
    } else if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>;
      const key = ['games', 'matches', 'data', 'results'].find(k => Array.isArray(obj[k]));
      if (key) games = obj[key] as unknown[];
    }

    const results: Wc26MatchResult[] = [];
    let hasLive = false;

    for (const raw of games) {
      if (!raw || typeof raw !== 'object') continue;
      const g = raw as Wc26Game;

      const homeCode = resolveTeamName(g.home_team);
      const awayCode = resolveTeamName(g.away_team);
      if (!homeCode || !awayCode) continue;

      const live = isLiveStatus(g.status);
      const finished = isFinishedStatus(g.status);
      if (!live && !finished) continue;

      const g1 = typeof g.home_score === 'number' ? g.home_score : 0;
      const g2 = typeof g.away_score === 'number' ? g.away_score : 0;

      if (live) hasLive = true;

      results.push({
        homeCode,
        awayCode,
        g1: finished ? g1 : 0,
        g2: finished ? g2 : 0,
        finished,
        live,
        ...(live ? { g1Live: g1, g2Live: g2 } : {}),
      });
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: results, hasLive }));
    } catch { /* storage full */ }

    return results;
  } catch {
    return [];
  }
}
