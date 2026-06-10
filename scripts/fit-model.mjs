/**
 * scripts/fit-model.mjs
 *
 * Lädt historische Länderspielergebnisse (martj42-Dataset),
 * passt ein Poisson-Attack/Defense-Modell per IPF-MLE an,
 * findet optimales Zeitgewichtungs-ξ per Walk-Forward-Backtesting
 * und schreibt kalibrierte NATION_STATS zurück in nations.ts.
 *
 * Ausführen: node scripts/fit-model.mjs
 * Ausgabe:   src/lib/nations.ts (NATION_STATS-Block wird ersetzt)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. FIFA-Code-Mapping (martj42-Teamname → FIFA-Code)
// ---------------------------------------------------------------------------

const TEAM_MAP = {
  // Top tier
  'Argentina': 'ARG', 'France': 'FRA', 'England': 'ENG',
  'Spain': 'ESP', 'Brazil': 'BRA', 'Portugal': 'POR',
  'Netherlands': 'NED', 'Germany': 'GER', 'Uruguay': 'URU',
  'Colombia': 'COL', 'Belgium': 'BEL',
  // Group-stage teams
  'United States': 'USA', 'Mexico': 'MEX', 'Morocco': 'MAR',
  'Japan': 'JPN', 'Canada': 'CAN', 'Senegal': 'SEN',
  'Croatia': 'CRO', 'Switzerland': 'SUI', 'Austria': 'AUT',
  'Denmark': 'DEN', 'Ukraine': 'UKR', 'Iran': 'IRN',
  'Australia': 'AUS', 'Serbia': 'SRB', 'Sweden': 'SWE',
  'Turkey': 'TUR', 'Türkiye': 'TUR', 'Norway': 'NOR',
  'South Korea': 'KOR', 'Poland': 'POL',
  'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Ecuador': 'ECU', 'Scotland': 'SCO', 'Slovenia': 'SVN',
  "Ivory Coast": 'CIV', "Côte d'Ivoire": 'CIV', "Cote d'Ivoire": 'CIV',
  'Saudi Arabia': 'SAU', 'Nigeria': 'NGA', 'Egypt': 'EGY',
  'Algeria': 'ALG', 'Paraguay': 'PAR',
  'Bosnia and Herzegovina': 'BIH', 'Bosnia & Herzegovina': 'BIH',
  'Cameroon': 'CMR', 'Ghana': 'GHA', 'Tunisia': 'TUN',
  'DR Congo': 'COD', 'Democratic Republic of the Congo': 'COD',
  'Venezuela': 'VEN', 'Panama': 'PAN', 'Iraq': 'IRQ',
  'Qatar': 'QAT', 'South Africa': 'RSA', 'Uzbekistan': 'UZB',
  'Jamaica': 'JAM', 'Jordan': 'JOR', 'Cape Verde': 'CPV',
  'Honduras': 'HON', 'Curaçao': 'CUW', 'Curacao': 'CUW',
  'New Zealand': 'NZL', 'Haiti': 'HAI',
};

// Alle WM-2026-Teams
const WM_TEAMS = new Set(Object.values(TEAM_MAP));

// ---------------------------------------------------------------------------
// 2. CSV laden und parsen
// ---------------------------------------------------------------------------

async function fetchMatches() {
  const URL = 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';
  console.log('Lade Matchdaten von martj42...');
  const res = await fetch(URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  const dateIdx    = header.indexOf('date');
  const homeIdx    = header.indexOf('home_team');
  const awayIdx    = header.indexOf('away_team');
  const homeGIdx   = header.indexOf('home_score');
  const awayGIdx   = header.indexOf('away_score');
  const neutralIdx = header.indexOf('neutral');

  const matches = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const date = cols[dateIdx]?.trim();
    if (!date || date < '2018-01-01') continue;         // nur ab 2018

    const homeRaw = cols[homeIdx]?.trim();
    const awayRaw = cols[awayIdx]?.trim();
    const home = TEAM_MAP[homeRaw];
    const away = TEAM_MAP[awayRaw];
    if (!home || !away) continue;                        // nur WM-Teams
    if (!WM_TEAMS.has(home) || !WM_TEAMS.has(away)) continue;

    const hg = parseInt(cols[homeGIdx], 10);
    const ag = parseInt(cols[awayGIdx], 10);
    if (isNaN(hg) || isNaN(ag)) continue;

    const neutral = cols[neutralIdx]?.trim().toLowerCase() === 'true';
    matches.push({ date, home, away, hg, ag, neutral });
  }

  console.log(`  ${matches.length} Spiele geladen (ab 2018, WM-Teams)`);
  return matches.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// 3. Zeitgewichtung
// ---------------------------------------------------------------------------

function daysBetween(d1, d2) {
  return (new Date(d2) - new Date(d1)) / 86_400_000;
}

function addWeights(matches, refDate, xi) {
  return matches
    .filter(m => m.date < refDate)
    .map(m => ({
      ...m,
      w: Math.exp(-xi * daysBetween(m.date, refDate)),
    }));
}

// ---------------------------------------------------------------------------
// 4. IPF-Fitting (Iterative Proportional Fitting / Poisson-MLE)
//    lH = att_H * def_A,  lA = att_A * def_H
//    (Neutral-Ground-Modell, kein Home-Advantage)
// ---------------------------------------------------------------------------

function fitIPF(weightedMatches, maxIter = 150, tol = 1e-6) {
  const teams = [...WM_TEAMS];
  const att = {}, def = {};
  for (const t of teams) { att[t] = 1.0; def[t] = 1.0; }

  for (let iter = 0; iter < maxIter; iter++) {
    let maxDelta = 0;

    // Update attack
    for (const t of teams) {
      let num = 0, den = 0;
      for (const m of weightedMatches) {
        if (m.home === t) { num += m.w * m.hg; den += m.w * def[m.away]; }
        if (m.away === t) { num += m.w * m.ag; den += m.w * def[m.home]; }
      }
      const newAtt = num > 0 && den > 0 ? num / den : att[t];
      maxDelta = Math.max(maxDelta, Math.abs(newAtt - att[t]));
      att[t] = newAtt;
    }

    // Update defense
    for (const t of teams) {
      let num = 0, den = 0;
      for (const m of weightedMatches) {
        if (m.home === t) { num += m.w * m.ag; den += m.w * att[m.away]; }
        if (m.away === t) { num += m.w * m.hg; den += m.w * att[m.home]; }
      }
      const newDef = num > 0 && den > 0 ? num / den : def[t];
      maxDelta = Math.max(maxDelta, Math.abs(newDef - def[t]));
      def[t] = newDef;
    }

    // Normalize: mean(att) = mean(def) = 1
    const attMean = teams.reduce((s, t) => s + att[t], 0) / teams.length;
    const defMean = teams.reduce((s, t) => s + def[t], 0) / teams.length;
    for (const t of teams) { att[t] /= attMean; def[t] /= defMean; }

    if (maxDelta < tol) break;
  }

  return { att, def };
}

// ---------------------------------------------------------------------------
// 5. Poisson-Wahrscheinlichkeiten und Log-Loss
// ---------------------------------------------------------------------------

function poissonPMF(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function match1x2Probs(lH, lA, MAX = 8) {
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i <= MAX; i++) {
    const pi = poissonPMF(i, lH);
    for (let j = 0; j <= MAX; j++) {
      const pj = poissonPMF(j, lA);
      const p  = pi * pj;
      if (i > j) pH += p;
      else if (i === j) pD += p;
      else pA += p;
    }
  }
  const s = pH + pD + pA;
  return { pH: pH / s, pD: pD / s, pA: pA / s };
}

function logLoss(testMatches, att, def) {
  let total = 0, n = 0;
  for (const m of testMatches) {
    if (!att[m.home] || !att[m.away]) continue;
    const lH = att[m.home] * def[m.away];
    const lA = att[m.away] * def[m.home];
    const { pH, pD, pA } = match1x2Probs(lH, lA);
    const outcome = m.hg > m.ag ? pH : m.hg === m.ag ? pD : pA;
    total += -Math.log(Math.max(outcome, 1e-10));
    n++;
  }
  return n > 0 ? total / n : Infinity;
}

// ---------------------------------------------------------------------------
// 6. Walk-Forward Backtesting — findet bestes ξ (Spec Abschnitt 4)
// ---------------------------------------------------------------------------

async function walkForward(matches) {
  const XI_GRID    = [0.0, 0.0005, 0.001, 0.0015, 0.002, 0.003, 0.005];
  const splitDates = [
    '2023-06-01', '2023-12-01',
    '2024-06-01', '2024-12-01',
    '2025-06-01', '2025-12-01',
  ];

  const agg = {};
  for (const xi of XI_GRID) agg[xi] = [];

  for (const splitDate of splitDates) {
    const train = matches.filter(m => m.date < splitDate);
    const test  = matches.filter(m => m.date >= splitDate && m.date < addMonths(splitDate, 6));
    if (train.length < 30 || test.length < 5) continue;

    for (const xi of XI_GRID) {
      const weighted = addWeights(train, splitDate, xi);
      const { att, def } = fitIPF(weighted);
      const ll = logLoss(test, att, def);
      if (isFinite(ll)) agg[xi].push(ll);
    }
  }

  let bestXi = 0.002, bestLL = Infinity;
  for (const xi of XI_GRID) {
    const vals = agg[xi];
    if (vals.length === 0) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    console.log(`  ξ=${xi.toFixed(4)}  log-loss=${mean.toFixed(4)}  (${vals.length} Splits)`);
    if (mean < bestLL) { bestLL = mean; bestXi = xi; }
  }
  console.log(`  → Bestes ξ: ${bestXi} (log-loss ${bestLL.toFixed(4)})`);
  return { bestXi, bestLL };
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// 7. Finales Modell — skaliert zu hGF/hGA-Format
// ---------------------------------------------------------------------------

function scaleStats(att, def, avgGoals, rankMap) {
  // hGF_i = att_i * sqrt(avgGoals)
  // hGA_i = def_i * sqrt(avgGoals)
  // Produkt hGF_H * hGA_A = att_H * def_A * avgGoals ≈ lambda_H bei avg-Matchup
  const scale = Math.sqrt(avgGoals);

  // Bayesian Shrinkage: Teams mit wenig Daten → Prior att=1, def=1
  const result = {};
  for (const t of WM_TEAMS) {
    const a = Math.min(4.0, Math.max(0.3, (att[t] ?? 1.0) * scale));
    const d = Math.min(2.5, Math.max(0.4, (def[t] ?? 1.0) * scale));
    const rank = rankMap[t] ?? 48;
    result[t] = { rank, hGF: +a.toFixed(2), hGA: +d.toFixed(2), aGF: +a.toFixed(2), aGA: +d.toFixed(2) };
  }
  return result;
}

function avgGoalsFromMatches(matches) {
  const total = matches.reduce((s, m) => s + m.hg + m.ag, 0);
  return total / (2 * matches.length);
}

// ---------------------------------------------------------------------------
// 8. Ranking-Map aus aktueller nations.ts extrahieren
// ---------------------------------------------------------------------------

function extractRankMap() {
  const src = readFileSync(join(ROOT, 'src/lib/nations.ts'), 'utf-8');
  const rankMap = {};
  const re = /(\w{2,3}):\s*\{\s*rank:\s*(\d+)/g;
  let m;
  while ((m = re.exec(src)) !== null) rankMap[m[1]] = parseInt(m[2], 10);
  return rankMap;
}

// ---------------------------------------------------------------------------
// 9. nations.ts NATION_STATS-Block ersetzen
// ---------------------------------------------------------------------------

function buildStatsBlock(stats) {
  const entries = Object.entries(stats)
    .sort(([, a], [, b]) => a.rank - b.rank)
    .map(([code, s]) => {
      const pad = ' '.repeat(Math.max(0, 3 - code.length));
      return `  ${code}:${pad} { rank: ${String(s.rank).padStart(2)}, hGF: ${s.hGF.toFixed(2)}, hGA: ${s.hGA.toFixed(2)}, aGF: ${s.aGF.toFixed(2)}, aGA: ${s.aGA.toFixed(2)} },`;
    })
    .join('\n');
  return entries;
}

function updateNationsTs(stats, meta) {
  const tsPath = join(ROOT, 'src/lib/nations.ts');
  let src = readFileSync(tsPath, 'utf-8');

  const startMarker = 'export const NATION_STATS: Record<string, TeamStats> = {';
  const endMarker   = '};';

  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error('NATION_STATS block not found in nations.ts');

  const afterOpen = src.indexOf('\n', start) + 1;
  const close     = src.indexOf('\n' + endMarker, afterOpen);
  if (close === -1) throw new Error('Could not find closing }; of NATION_STATS');

  const header = [
    `// Auto-generiert von scripts/fit-model.mjs — nicht manuell editieren`,
    `// Generiert: ${meta.generatedAt}`,
    `// Trainiert auf ${meta.nMatches} Spielen ab 2018 (WM-Teams), ξ=${meta.bestXi}`,
    `// Walk-Forward Log-Loss: ${meta.bestLL.toFixed(4)} | Skalierung: sqrt(avg_goals=${meta.avgGoals.toFixed(3)})`,
  ].map(l => '// ' + l.slice(3)).join('\n');

  const newBlock = header + '\n' + buildStatsBlock(stats);

  src = src.slice(0, afterOpen) + newBlock + '\n' + src.slice(close);
  writeFileSync(tsPath, src, 'utf-8');
  console.log('  nations.ts aktualisiert.');
}

// ---------------------------------------------------------------------------
// 10. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== fit-model.mjs — WM 2026 Team-Stats Kalibrierung ===\n');

  const matches  = await fetchMatches();
  const rankMap  = extractRankMap();
  const refDate  = '2026-06-11'; // Turnierbeginn

  console.log('\nWalk-Forward Backtesting (ξ-Suche):');
  const { bestXi, bestLL } = await walkForward(matches);

  console.log('\nFinales Modell fitten...');
  const weighted = addWeights(matches, refDate, bestXi);
  const { att, def } = fitIPF(weighted);

  const avgGoals = avgGoalsFromMatches(matches);
  console.log(`  Ø Tore pro Team pro Spiel: ${avgGoals.toFixed(3)}`);

  const stats = scaleStats(att, def, avgGoals, rankMap);

  const meta = {
    generatedAt: new Date().toISOString(),
    bestXi,
    bestLL,
    nMatches: matches.length,
    avgGoals,
  };

  console.log('\nSchreibe nations.ts...');
  updateNationsTs(stats, meta);

  console.log('\nTop 10 Titelchancen (Attack-Stärke):');
  Object.entries(stats)
    .sort(([, a], [, b]) => b.hGF - a.hGF)
    .slice(0, 10)
    .forEach(([code, s], i) => {
      console.log(`  ${i + 1}. ${code}  att=${s.hGF.toFixed(2)}  def=${s.hGA.toFixed(2)}`);
    });

  console.log('\n✓ Fertig. Führe jetzt `npm run deploy` aus.\n');
}

main().catch(err => { console.error('Fehler:', err.message); process.exit(1); });
