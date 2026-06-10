import type { MarketProbs } from './poisson';

const ODDS_KEY  = import.meta.env.VITE_ODDS_API_KEY ?? '';
const CACHE_KEY = 'wm_odds_v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 Stunden

const ODDS_TEAM_MAP: Record<string, string> = {
  // Group A
  'Mexico': 'MEX', 'South Korea': 'KOR', 'Korea Republic': 'KOR',
  'South Africa': 'RSA', 'Czech Republic': 'CZE', 'Czechia': 'CZE',
  // Group B
  'Canada': 'CAN', 'Qatar': 'QAT',
  'Bosnia and Herzegovina': 'BIH', 'Bosnia & Herzegovina': 'BIH', 'Bosnia-Herzegovina': 'BIH',
  'Switzerland': 'SUI',
  // Group C
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  // Group D
  'United States': 'USA', 'USA': 'USA', 'Paraguay': 'PAR',
  'Australia': 'AUS', 'Turkey': 'TUR', 'Türkiye': 'TUR',
  // Group E
  'Germany': 'GER', 'Curaçao': 'CUW', 'Curacao': 'CUW',
  "Cote d'Ivoire": 'CIV', "Côte d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  // Group F
  'Netherlands': 'NED', 'Holland': 'NED', 'Japan': 'JPN',
  'Sweden': 'SWE', 'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'IR Iran': 'IRN',
  'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Cabo Verde': 'CPV',
  'Saudi Arabia': 'SAU', 'Uruguay': 'URU',
  // Group I
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  // Group J
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  // Group K
  'Portugal': 'POR',
  'DR Congo': 'COD', 'Congo DR': 'COD', 'Democratic Republic of Congo': 'COD',
  'Uzbekistan': 'UZB', 'Colombia': 'COL',
  // Group L
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
  // Others that may appear
  'Denmark': 'DEN', 'Poland': 'POL', 'Serbia': 'SRB', 'Ukraine': 'UKR',
  'Slovenia': 'SVN', 'Venezuela': 'VEN', 'Jamaica': 'JAM', 'Honduras': 'HON',
  'Nigeria': 'NGA', 'Cameroon': 'CMR', 'South Africa': 'RSA',
};

// Bevorzugte Buchmacher nach Qualität (Pinnacle = schärfste Linien, geringste Marge)
const PREFERRED_BOOKMAKERS = ['pinnacle', 'bet365', 'unibet', 'williamhill', 'betfair'];

type Bookmaker = {
  key: string;
  markets: Array<{
    key: string;
    outcomes: Array<{ name: string; price: number }>;
  }>;
};

type OddsGame = {
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

function decimalToImplied(dec: number): number {
  return 1 / dec;
}

function normalizeProbs(h: number, d: number, a: number): MarketProbs {
  const sum = h + d + a;
  return { h: (h / sum) * 100, d: (d / sum) * 100, a: (a / sum) * 100 };
}

function bestBookmaker(bookmakers: Bookmaker[]): Bookmaker | null {
  for (const name of PREFERRED_BOOKMAKERS) {
    const found = bookmakers.find(b => b.key.includes(name));
    if (found) return found;
  }
  return bookmakers[0] ?? null;
}

// Schätzt Draw-Wahrscheinlichkeit aus Heimsieg/Auswärtssieg-Implied-Odds.
// h und a sind rohe Implied-Werte (mit Overround) — ihr Verhältnis gibt
// die Ausgeglichenheit des Spiels an, unabhängig von der Buchmacher-Marge.
function poissonDrawFallback(h: number, a: number): number {
  const total = h + a;
  if (total <= 0) return 0.25;
  const balance = Math.min(h, a) / Math.max(h, a); // 0 = einseitig, 1 = ausgeglichen
  return 0.17 + balance * 0.14; // 0.17 bei Favorit, 0.31 bei Gleichstand
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

      const bm = bestBookmaker(g.bookmakers);
      if (!bm) continue;
      const market = bm.markets.find(m => m.key === 'h2h');
      if (!market) continue;

      let h = 0, d = 0, a = 0;
      for (const o of market.outcomes) {
        if (o.name === g.home_team) h = decimalToImplied(o.price);
        else if (o.name === g.away_team) a = decimalToImplied(o.price);
        else d = decimalToImplied(o.price);
      }
      if (h && a) {
        const drawFallback = d || poissonDrawFallback(h, a);
        data[`${homeCode}-${awayCode}`] = normalizeProbs(h, drawFallback, a);
      }
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage voll */ }

    return data;
  } catch {
    return {};
  }
}
