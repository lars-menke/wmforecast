import type { MarketProbs } from './poisson';

const ODDS_KEY  = import.meta.env.VITE_ODDS_API_KEY ?? '';
const CACHE_KEY = 'wm_odds_v3'; // v3: rohe Dezimalquoten fuer das Wett-Radar zusaetzlich gespeichert

// Rohe Dezimalquoten (inkl. Buchmacher-Marge) — Basis fuer EV-Berechnung.
// d = 0 bedeutet: kein Remis-Preis verfuegbar (z.B. Zwei-Wege-Markt).
export type RawOdds = { h: number; d: number; a: number };

// Letzter bekannter Quotenstand je "HOME-AWAY" (aus demselben Cache wie die Probs).
export function getRawOdds(): Record<string, RawOdds> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    const { raw } = JSON.parse(cached) as { raw?: Record<string, RawOdds> };
    return raw ?? {};
  } catch { return {}; }
}
const QUOTA_KEY = 'wm_odds_quota_v1';

export type OddsQuota = { remaining: number; used: number; ts: number };

// Letzter bekannter Request-Kontostand der Odds API (aus Response-Headern).
export function getOddsQuota(): OddsQuota | null {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    return raw ? (JSON.parse(raw) as OddsQuota) : null;
  } catch { return null; }
}

function storeQuota(headers: Headers): void {
  const remaining = parseInt(headers.get('x-requests-remaining') ?? '', 10);
  const used = parseInt(headers.get('x-requests-used') ?? '', 10);
  if (Number.isNaN(remaining)) return;
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({
      remaining,
      used: Number.isNaN(used) ? 0 : used,
      ts: Date.now(),
    } satisfies OddsQuota));
  } catch { /* ignore */ }
}
const CACHE_TTL = 20 * 60 * 1000; // 20 Minuten

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
  'Nigeria': 'NGA', 'Cameroon': 'CMR',
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

// Findet gezielt den FIFA-WM-Turnier-Key. Wichtig: NICHT nach "cup" allein
// suchen — sonst matcht soccer_england_efl_cup / soccer_fa_cup usw. zuerst.
// Reihenfolge: exakter WM-Key > WM-Turnier-Key (kein Quali/Winner) > Fallback.
export function findWorldCupKey<T extends { key: string }>(sports: T[]): T | undefined {
  const exact = sports.find(s => s.key === 'soccer_fifa_world_cup');
  if (exact) return exact;
  const tournament = sports.find(s =>
    s.key.startsWith('soccer_fifa_world_cup')
    && !s.key.includes('qualif')
    && !s.key.includes('winner'),
  );
  if (tournament) return tournament;
  // Letzter Ausweg: muss "world" UND "cup" enthalten (schließt EFL/FA-Cup aus)
  return sports.find(s =>
    s.key.startsWith('soccer') && s.key.includes('world') && s.key.includes('cup')
    && !s.key.includes('qualif') && !s.key.includes('women'),
  );
}

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

export async function fetchOdds(liveOrFinishedKeys?: Set<string>): Promise<Record<string, MarketProbs>> {
  // Always load existing cache first
  let existingCache: Record<string, MarketProbs> = {};
  let existingRaw: Record<string, RawOdds> = {};
  let cacheAge = Infinity;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data, raw } = JSON.parse(cached) as {
        ts: number; data: Record<string, MarketProbs>; raw?: Record<string, RawOdds>;
      };
      existingCache = data;
      existingRaw = raw ?? {};
      cacheAge = Date.now() - ts;
    }
  } catch { /* ignore */ }

  // Return cache if still fresh and no API key
  if (cacheAge < CACHE_TTL && !ODDS_KEY) return existingCache;
  if (!ODDS_KEY) return existingCache;

  // If cache is still fresh, return it directly
  if (cacheAge < CACHE_TTL) return existingCache;

  try {
    // Discover WM sport key dynamically
    const sportsR = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_KEY}`);
    if (!sportsR.ok) return existingCache;
    const sports = await sportsR.json() as Array<{ key: string; active: boolean }>;
    const wc = findWorldCupKey(sports);
    if (!wc) return existingCache;

    const url = `https://api.the-odds-api.com/v4/sports/${wc.key}/odds/?apiKey=${ODDS_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
    const r = await fetch(url);
    storeQuota(r.headers);
    if (!r.ok) return existingCache;

    const games = (await r.json()) as OddsGame[];
    const freshData: Record<string, MarketProbs> = {};
    const freshRaw: Record<string, RawOdds> = {};

    for (const g of games) {
      const homeCode = ODDS_TEAM_MAP[g.home_team];
      const awayCode = ODDS_TEAM_MAP[g.away_team];
      if (!homeCode || !awayCode) continue;

      const bm = bestBookmaker(g.bookmakers);
      if (!bm) continue;
      const market = bm.markets.find(m => m.key === 'h2h');
      if (!market) continue;

      let h = 0, d = 0, a = 0;
      let oH = 0, oD = 0, oA = 0;
      for (const o of market.outcomes) {
        if (o.name === g.home_team) { h = decimalToImplied(o.price); oH = o.price; }
        else if (o.name === g.away_team) { a = decimalToImplied(o.price); oA = o.price; }
        else { d = decimalToImplied(o.price); oD = o.price; }
      }
      if (h && a) {
        const drawFallback = d || poissonDrawFallback(h, a);
        const key = `${homeCode}-${awayCode}`;
        freshData[key] = normalizeProbs(h, drawFallback, a);
        freshRaw[key] = { h: oH, d: oD, a: oA };
      }
    }

    // Merge: keep cached value for live/finished matches, use fresh for others
    const merged: Record<string, MarketProbs> = { ...freshData };
    const mergedRaw: Record<string, RawOdds> = { ...freshRaw };
    if (liveOrFinishedKeys) {
      for (const key of liveOrFinishedKeys) {
        if (existingCache[key] !== undefined) merged[key] = existingCache[key];
        if (existingRaw[key] !== undefined) mergedRaw[key] = existingRaw[key];
      }
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: merged, raw: mergedRaw }));
    } catch { /* storage voll */ }

    return merged;
  } catch {
    return existingCache;
  }
}
