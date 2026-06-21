#!/usr/bin/env node
// scripts/train-from-statsbomb.mjs
// Derives NATION_STATS + HARDCODED_CALIB from:
//   - martj42/international_results (weighted by tournament type + time decay) → NATION_STATS
//   - StatsBomb open data WM 2018 + 2022 (group stage only) → HARDCODED_CALIB
// Usage: node scripts/train-from-statsbomb.mjs

const BASE_SB = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data';
const MARTJ42_URL = 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';

// ---------------------------------------------------------------------------
// Team name → FIFA code mapping (martj42 uses full country names)
// ---------------------------------------------------------------------------

const TEAM_MAP = {
  // Americas
  'Argentina': 'ARG', 'Brazil': 'BRA', 'Colombia': 'COL', 'Uruguay': 'URU',
  'Ecuador': 'ECU', 'Paraguay': 'PAR', 'Venezuela': 'VEN', 'Peru': 'PER',
  'Chile': 'CHI', 'Bolivia': 'BOL',
  'United States': 'USA', 'Mexico': 'MEX', 'Canada': 'CAN', 'Panama': 'PAN',
  'Costa Rica': 'CRC', 'Honduras': 'HON', 'Jamaica': 'JAM',
  'Trinidad and Tobago': 'TRI', 'El Salvador': 'SLV', 'Cuba': 'CUB',
  'Haiti': 'HAI', 'Curacao': 'CUW',
  // Europe
  'France': 'FRA', 'Spain': 'ESP', 'England': 'ENG', 'Portugal': 'POR',
  'Netherlands': 'NED', 'Germany': 'GER', 'Belgium': 'BEL', 'Croatia': 'CRO',
  'Switzerland': 'SUI', 'Austria': 'AUT', 'Denmark': 'DEN', 'Ukraine': 'UKR',
  'Serbia': 'SRB', 'Poland': 'POL', 'Scotland': 'SCO', 'Slovenia': 'SVN',
  'Turkey': 'TUR', 'Iceland': 'ISL', 'Sweden': 'SWE', 'Wales': 'WAL',
  'Czech Republic': 'CZE', 'Czechia': 'CZE', 'Slovakia': 'SVK',
  'Hungary': 'HUN', 'Norway': 'NOR', 'Romania': 'ROU', 'Greece': 'GRE',
  'Russia': 'RUS', 'Bosnia and Herzegovina': 'BIH', 'Albania': 'ALB',
  'Finland': 'FIN', 'North Macedonia': 'MKD', 'Georgia': 'GEO',
  'Kosovo': 'KVX', 'Montenegro': 'MNE', 'Luxembourg': 'LUX',
  'Israel': 'ISR', 'Republic of Ireland': 'IRL', 'Ireland': 'IRL',
  'Bulgaria': 'BUL', 'Cyprus': 'CYP', 'Estonia': 'EST', 'Latvia': 'LVA',
  'Lithuania': 'LTU', 'Belarus': 'BLR', 'Armenia': 'ARM', 'Azerbaijan': 'AZE',
  'Moldova': 'MDA', 'Kazakhstan': 'KAZ', 'Faroe Islands': 'FRO',
  'Malta': 'MLT', 'Liechtenstein': 'LIE', 'San Marino': 'SMR',
  'Andorra': 'AND', 'Gibraltar': 'GIB',
  // Africa
  'Morocco': 'MAR', 'Senegal': 'SEN', 'Nigeria': 'NGA', 'Ghana': 'GHA',
  'Cameroon': 'CMR', 'Tunisia': 'TUN', 'Egypt': 'EGY', 'Algeria': 'ALG',
  "Ivory Coast": 'CIV', "Côte d'Ivoire": 'CIV',
  'DR Congo': 'COD', 'Democratic Republic of the Congo': 'COD',
  'South Africa': 'RSA', 'Cape Verde': 'CPV', 'Mali': 'MLI',
  'Burkina Faso': 'BFA', 'Guinea': 'GUI', 'Zambia': 'ZAM',
  'Tanzania': 'TAN', 'Uganda': 'UGA', 'Mozambique': 'MOZ',
  'Zimbabwe': 'ZIM', 'Namibia': 'NAM', 'Kenya': 'KEN',
  'Angola': 'ANG', 'Benin': 'BEN', 'Gabon': 'GAB',
  'Libya': 'LBA', 'Sudan': 'SDN', 'Ethiopia': 'ETH',
  // Asia / Middle East
  'Japan': 'JPN', 'South Korea': 'KOR', 'Iran': 'IRN', 'Saudi Arabia': 'SAU',
  'Australia': 'AUS', 'Qatar': 'QAT', 'Uzbekistan': 'UZB', 'Jordan': 'JOR',
  'Iraq': 'IRQ', 'China PR': 'CHN', 'China': 'CHN',
  'United Arab Emirates': 'UAE', 'Oman': 'OMA', 'Bahrain': 'BHR',
  'Kuwait': 'KUW', 'Thailand': 'THA', 'Vietnam': 'VIE',
  'Indonesia': 'IDN', 'Malaysia': 'MAS', 'India': 'IND',
  'Syria': 'SYR', 'Palestine': 'PLE', 'Yemen': 'YEM',
  'Kyrgyzstan': 'KGZ', 'Tajikistan': 'TJK', 'Turkmenistan': 'TKM',
  // Oceania
  'New Zealand': 'NZL',
};

// ---------------------------------------------------------------------------
// Tournament weight by competition type
// ---------------------------------------------------------------------------

function getTournamentWeight(tournament) {
  const t = tournament.toLowerCase();
  if (t === 'fifa world cup') return 3.0;
  if (t.includes('copa america') || t.includes('copa américa') ||
      t.includes('european championship') || t.includes('africa cup') ||
      t.includes('asian cup') || t.includes('gold cup') ||
      t.includes('ofc nations cup')) return 1.5;
  if (t.includes('nations league')) return 1.2;
  if (t.includes('qualification') || t.includes('qualifying')) return 1.0;
  if (t === 'friendly') return 0.5;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Time decay: half-life 2 years
// ---------------------------------------------------------------------------

const DECAY_HALFLIFE_DAYS = 730;
const TODAY = new Date('2026-06-21');

function timeWeight(dateStr) {
  const daysAgo = (TODAY - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  if (daysAgo < 0) return 0; // future match
  return Math.exp(-Math.LN2 / DECAY_HALFLIFE_DAYS * daysAgo);
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
}

// ---------------------------------------------------------------------------
// Poisson helpers
// ---------------------------------------------------------------------------

function poissonProb(lambda, k) {
  let logP = k * Math.log(lambda) - lambda;
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function matchProbs(lH, lA, maxG = 7) {
  let pH = 0, pD = 0, pA = 0;
  for (let g1 = 0; g1 <= maxG; g1++) {
    for (let g2 = 0; g2 <= maxG; g2++) {
      const p = poissonProb(lH, g1) * poissonProb(lA, g2);
      if (g1 > g2) pH += p;
      else if (g1 === g2) pD += p;
      else pA += p;
    }
  }
  return { pH, pD, pA };
}

// ---------------------------------------------------------------------------
// Platt scaling helpers
// ---------------------------------------------------------------------------

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function logit(p) { const c = Math.max(0.001, Math.min(0.999, p)); return Math.log(c / (1 - c)); }

// ---------------------------------------------------------------------------
// Step A: Fetch StatsBomb WM matches (for calibration)
// ---------------------------------------------------------------------------

async function fetchStatsBombMatches() {
  const urls = [
    `${BASE_SB}/matches/43/3.json`,   // WM 2018
    `${BASE_SB}/matches/43/106.json`, // WM 2022
  ];
  const results = [];
  for (const url of urls) {
    process.stderr.write(`Fetching ${url} ...\n`);
    const matches = await fetchJson(url);
    process.stderr.write(`  -> ${matches.length} matches\n`);
    for (const m of matches) {
      const home = m.home_team?.home_team_name;
      const away = m.away_team?.away_team_name;
      const hs = m.home_score;
      const as_ = m.away_score;
      const stage = m.competition_stage?.name ?? '';
      if (home == null || away == null || hs == null || as_ == null) continue;
      results.push({ home, away, hs, as: as_, stage });
    }
  }
  process.stderr.write(`StatsBomb total: ${results.length} WM matches\n`);
  return results;
}

// ---------------------------------------------------------------------------
// Step B: Fetch + parse martj42 CSV
// ---------------------------------------------------------------------------

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

async function fetchMartj42Matches(targetTeams) {
  process.stderr.write(`\nFetching martj42 CSV ...\n`);
  const text = await fetchText(MARTJ42_URL);
  const rows = parseCSV(text);
  process.stderr.write(`  -> ${rows.length} total rows\n`);

  const cutoff = new Date('2018-01-01');
  const mapped = [];
  let skipped = 0;

  for (const r of rows) {
    const date = new Date(r.date);
    if (isNaN(date) || date < cutoff) continue;

    const h = TEAM_MAP[r.home_team];
    const a = TEAM_MAP[r.away_team];
    if (!h || !a) { skipped++; continue; }
    if (!targetTeams.has(h) && !targetTeams.has(a)) continue;

    const hs = parseInt(r.home_score, 10);
    const as_ = parseInt(r.away_score, 10);
    if (isNaN(hs) || isNaN(as_)) continue;

    const tw = getTournamentWeight(r.tournament);
    const decay = timeWeight(r.date);
    const weight = tw * decay;
    if (weight < 1e-6) continue;

    mapped.push({ h, a, hs, as: as_, weight, date: r.date, tournament: r.tournament });
  }

  process.stderr.write(`  -> ${mapped.length} matches after filter (${skipped} teams unmapped)\n`);
  return mapped;
}

// ---------------------------------------------------------------------------
// Step C: Weighted IPF on martj42 data
// ---------------------------------------------------------------------------

function ipfStrengths(matches, label = 'IPF') {
  const teamsSet = new Set();
  for (const m of matches) { teamsSet.add(m.h); teamsSet.add(m.a); }
  const teams = [...teamsSet].sort();
  process.stderr.write(`\n${label}: ${teams.length} teams, ${matches.length} matches\n`);

  const attack  = Object.fromEntries(teams.map(t => [t, 1.0]));
  const defense = Object.fromEntries(teams.map(t => [t, 1.0]));

  for (let iter = 0; iter < 100; iter++) {
    // Update attack
    for (const t of teams) {
      const hM = matches.filter(m => m.h === t);
      const aM = matches.filter(m => m.a === t);
      let num = 0, den = 0;
      for (const m of hM) { num += m.weight * m.hs; den += m.weight * defense[m.a]; }
      for (const m of aM) { num += m.weight * m.as; den += m.weight * defense[m.h]; }
      attack[t] = den > 0 ? Math.max(num / den, 1e-9) : 1.0;
    }
    // Normalize attack
    const logMeanA = teams.reduce((s, t) => s + Math.log(Math.max(attack[t], 1e-9)), 0) / teams.length;
    const factorA = Math.exp(logMeanA);
    for (const t of teams) attack[t] = Math.max(attack[t] / factorA, 1e-9);

    // Update defense
    for (const t of teams) {
      const hM = matches.filter(m => m.h === t);
      const aM = matches.filter(m => m.a === t);
      let num = 0, den = 0;
      for (const m of hM) { num += m.weight * m.as; den += m.weight * attack[m.a]; }
      for (const m of aM) { num += m.weight * m.hs; den += m.weight * attack[m.h]; }
      defense[t] = den > 0 ? Math.max(num / den, 1e-9) : 1.0;
    }
    // Normalize defense separately
    const logMeanD = teams.reduce((s, t) => s + Math.log(Math.max(defense[t], 1e-9)), 0) / teams.length;
    const factorD = Math.exp(logMeanD);
    for (const t of teams) defense[t] = Math.max(defense[t] / factorD, 1e-9);
  }

  return { teams, attack, defense };
}

// ---------------------------------------------------------------------------
// Step D: Platt calibration on StatsBomb group stage
// ---------------------------------------------------------------------------

function trainCalib(sbMatches, attack, defense) {
  const groupStageKeywords = ['group stage', 'group'];
  const samples = sbMatches.filter(m =>
    groupStageKeywords.some(k => m.stage.toLowerCase().includes(k))
  );
  process.stderr.write(`\nCalibration samples (group stage): ${samples.length}\n`);

  const data = [];
  for (const m of samples) {
    const h = TEAM_MAP[m.home];
    const a = TEAM_MAP[m.away];
    if (!h || !a || !attack[h] || !attack[a]) continue;
    const lH = attack[h] * 1.3;
    const lA = attack[a] * 1.3;
    const { pH, pD, pA } = matchProbs(lH, lA);
    const actual = m.hs > m.as ? 'H' : m.hs === m.as ? 'D' : 'A';
    data.push({ pH, pD, pA, actual });
  }

  let aH = 1.0, bH = 0.0, aD = 1.0, bD = 0.0, aA = 1.0, bA = 0.0;
  const lr = 0.02;

  for (let it = 0; it < 300; it++) {
    let gaH = 0, gbH = 0, gaD = 0, gbD = 0, gaA = 0, gbA = 0;
    for (const s of data) {
      const lH_ = logit(s.pH), lD_ = logit(s.pD), lA_ = logit(s.pA);
      const cH = sigmoid(aH * lH_ + bH);
      const cD = sigmoid(aD * lD_ + bD);
      const cA = sigmoid(aA * lA_ + bA);
      const sum = cH + cD + cA;
      const pH_ = cH / sum, pD_ = cD / sum, pA_ = cA / sum;
      const dH = pH_ - (s.actual === 'H' ? 1 : 0);
      const dD = pD_ - (s.actual === 'D' ? 1 : 0);
      const dA = pA_ - (s.actual === 'A' ? 1 : 0);
      gaH += dH * cH * (1 - cH) * lH_; gbH += dH * cH * (1 - cH);
      gaD += dD * cD * (1 - cD) * lD_; gbD += dD * cD * (1 - cD);
      gaA += dA * cA * (1 - cA) * lA_; gbA += dA * cA * (1 - cA);
    }
    const n = data.length;
    aH -= lr * gaH / n; bH -= lr * gbH / n;
    aD -= lr * gaD / n; bD -= lr * gbD / n;
    aA -= lr * gaA / n; bA -= lr * gbA / n;
  }

  process.stderr.write(`Calibration: aH=${aH.toFixed(3)} bH=${bH.toFixed(3)} aD=${aD.toFixed(3)} bD=${bD.toFixed(3)} aA=${aA.toFixed(3)} bA=${bA.toFixed(3)}\n`);
  return { aH, bH, aD, bD, aA, bA, n: data.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  process.stderr.write('=== WMForecast Training Pipeline (martj42 + StatsBomb) ===\n\n');

  // Fetch StatsBomb for calibration
  const sbMatches = await fetchStatsBombMatches();

  // Determine target teams from StatsBomb WM teams + all TEAM_MAP codes
  const allFifaCodes = new Set(Object.values(TEAM_MAP));

  // Fetch martj42 for team strengths
  const martj42Matches = await fetchMartj42Matches(allFifaCodes);

  // Run weighted IPF
  const { teams, attack, defense } = ipfStrengths(martj42Matches, 'Weighted IPF (martj42 + decay)');

  // Rank by attack descending
  const ranked = [...teams].sort((a, b) => attack[b] - attack[a]);
  const rankOf = Object.fromEntries(ranked.map((t, i) => [t, i + 1]));

  // Log a few sanity-check values
  process.stderr.write('\nTop 10 attack strengths:\n');
  ranked.slice(0, 10).forEach(t => {
    process.stderr.write(`  ${t}: att=${attack[t].toFixed(3)} def=${defense[t].toFixed(3)}\n`);
  });

  // Train calibration on StatsBomb group stage
  const calib = trainCalib(sbMatches, attack, defense);

  // Build NATION_STATS snippet
  const statLines = ranked.map(t => {
    const att = (attack[t] * 1.3).toFixed(2);
    const def = (defense[t] * 1.0).toFixed(2);
    return `  ${t}: { rank: ${String(rankOf[t]).padStart(2)}, hGF: ${att}, hGA: ${def}, aGF: ${att}, aGA: ${def} },`;
  });

  const nationStatsSnippet = `// Auto-generiert von scripts/train-from-statsbomb.mjs
// Generiert: ${new Date().toISOString()}
// Basis: martj42 Länderspiele ab 2018 (Gewicht: WM=3x, Kontinental=1.5x, NL=1.2x, Quali=1x, Friendly=0.5x)
// Zeitdecay: Halbwertszeit 2 Jahre · Kalibrierung: StatsBomb WM 2018+2022 Gruppenphase (${calib.n} Spiele)
${statLines.join('\n')}`;

  const calibSnippet = `export const HARDCODED_CALIB: CalibParams = {
  aH: ${calib.aH.toFixed(3)}, bH: ${calib.bH.toFixed(3)},
  aD: ${calib.aD.toFixed(3)}, bD: ${calib.bD.toFixed(3)},
  aA: ${calib.aA.toFixed(3)}, bA: ${calib.bA.toFixed(3)},
  n: ${calib.n},
};`;

  const { writeFile } = await import('node:fs/promises');
  await writeFile('/tmp/nation-stats-update.ts', nationStatsSnippet, 'utf8');
  await writeFile('/tmp/hardcoded-calib-update.ts', calibSnippet, 'utf8');
  process.stderr.write('\nWrote /tmp/nation-stats-update.ts\n');
  process.stderr.write('Wrote /tmp/hardcoded-calib-update.ts\n');

  process.stdout.write('\n=== NATION_STATS snippet ===\n');
  process.stdout.write(nationStatsSnippet + '\n');
  process.stdout.write('\n=== HARDCODED_CALIB snippet ===\n');
  process.stdout.write(calibSnippet + '\n');

  return { attack, defense, rankOf, calib, teams };
}

main().catch(e => {
  process.stderr.write(`ERROR: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
