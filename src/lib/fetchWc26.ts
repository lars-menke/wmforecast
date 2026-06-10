const WC26_BASE = 'https://worldcup26.ir';
const WC26_TOKEN = import.meta.env.VITE_WC26_TOKEN ?? '';

const CACHE_KEY = 'wm_wc26_v1';
const CACHE_TTL_LIVE     = 30 * 1000;       // 30s for live matches
const CACHE_TTL_FINISHED = 3 * 60 * 1000;   // 3 min standard

// Unknown API response — typed loosely, with safe property access
type Wc26Game = {
  id?: number;
  home_team?: string | { name?: string; code?: string };
  away_team?: string | { name?: string; code?: string };
  home_score?: number | null;
  away_score?: number | null;
  status?: string; // 'finished', 'completed', 'live', 'upcoming', etc.
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
  'Ivory Coast': 'CIV', 'Côte d\'Ivoire': 'CIV', 'Cote d\'Ivoire': 'CIV', "Cote d'Ivoire": 'CIV', 'CIV': 'CIV',
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
