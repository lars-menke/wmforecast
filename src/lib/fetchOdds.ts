import type { MarketProbs } from './poisson';

const ODDS_KEY  = import.meta.env.VITE_ODDS_API_KEY ?? '';
const CACHE_KEY = 'wm_odds_v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 Stunden

const ODDS_TEAM_MAP: Record<string, string> = {
  'Argentina': 'ARG', 'Brazil': 'BRA', 'France': 'FRA', 'England': 'ENG',
  'Spain': 'ESP', 'Portugal': 'POR', 'Netherlands': 'NED', 'Germany': 'GER',
  'Belgium': 'BEL', 'Uruguay': 'URU', 'Colombia': 'COL', 'Croatia': 'CRO',
  'USA': 'USA', 'Mexico': 'MEX', 'Canada': 'CAN', 'Japan': 'JPN',
  'South Korea': 'KOR', 'Morocco': 'MAR', 'Senegal': 'SEN', 'Australia': 'AUS',
  'Switzerland': 'SUI', 'Denmark': 'DEN', 'Austria': 'AUT', 'Poland': 'POL',
  'Serbia': 'SRB', 'Turkey': 'TUR', 'Ukraine': 'UKR', 'Scotland': 'SCO',
  'Slovenia': 'SVN', 'Ecuador': 'ECU', 'Venezuela': 'VEN', 'Paraguay': 'PAR',
  'Iran': 'IRN', 'Saudi Arabia': 'SAU', 'Qatar': 'QAT', 'Iraq': 'IRQ',
  'Jordan': 'JOR', 'Egypt': 'EGY', 'Nigeria': 'NGA', "Cote d'Ivoire": 'CIV',
  'Ghana': 'GHA', 'Cameroon': 'CMR', 'Tunisia': 'TUN', 'South Africa': 'RSA',
  'New Zealand': 'NZL', 'Jamaica': 'JAM', 'Honduras': 'HON', 'Panama': 'PAN',
};

type OddsGame = {
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
};

function decimalToImplied(dec: number): number {
  return 1 / dec;
}

function normalizeProbs(h: number, d: number, a: number): MarketProbs {
  const sum = h + d + a;
  return { h: (h / sum) * 100, d: (d / sum) * 100, a: (a / sum) * 100 };
}

export async function fetchOdds(): Promise<Record<string, MarketProbs>> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as { ts: number; data: Record<string, MarketProbs> };
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  if (!ODDS_KEY) return {};

  try {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_world_cup/odds/?apiKey=${ODDS_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
    const r = await fetch(url);
    if (!r.ok) return {};

    const games = (await r.json()) as OddsGame[];
    const data: Record<string, MarketProbs> = {};

    for (const g of games) {
      const homeCode = ODDS_TEAM_MAP[g.home_team];
      const awayCode = ODDS_TEAM_MAP[g.away_team];
      if (!homeCode || !awayCode) continue;

      const bm = g.bookmakers[0];
      if (!bm) continue;
      const market = bm.markets.find(m => m.key === 'h2h');
      if (!market) continue;

      let h = 0, d = 0, a = 0;
      for (const o of market.outcomes) {
        if (o.name === g.home_team) h = decimalToImplied(o.price);
        else if (o.name === g.away_team) a = decimalToImplied(o.price);
        else d = decimalToImplied(o.price);
      }
      if (h && a) data[`${homeCode}-${awayCode}`] = normalizeProbs(h, d || 0.28, a);
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage voll */ }

    return data;
  } catch {
    return {};
  }
}
