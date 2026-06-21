#!/usr/bin/env node
// scripts/train-from-statsbomb.mjs
// Derives NATION_STATS + HARDCODED_CALIB from StatsBomb open data (WM 2018 + 2022)
// Usage: node scripts/train-from-statsbomb.mjs

const BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data';

const TEAM_MAP = {
  'France': 'FRA', 'Croatia': 'CRO', 'Belgium': 'BEL', 'England': 'ENG',
  'Uruguay': 'URU', 'Russia': 'RUS', 'Sweden': 'SWE', 'Brazil': 'BRA',
  'Colombia': 'COL', 'Switzerland': 'SUI', 'Japan': 'JPN', 'Mexico': 'MEX',
  'Denmark': 'DEN', 'Spain': 'ESP', 'Portugal': 'POR', 'Argentina': 'ARG',
  'Germany': 'GER', 'South Korea': 'KOR', 'Australia': 'AUS', 'Nigeria': 'NGA',
  'Poland': 'POL', 'Senegal': 'SEN', 'Tunisia': 'TUN', 'Morocco': 'MAR',
  'Saudi Arabia': 'SAU', 'Iran': 'IRN', 'Egypt': 'EGY', 'Panama': 'PAN',
  'Costa Rica': 'CRC', 'Serbia': 'SRB', 'Iceland': 'ISL', 'Peru': 'PER',
  'Qatar': 'QAT', 'Ecuador': 'ECU', 'Netherlands': 'NED', 'United States': 'USA',
  'Wales': 'WAL', 'Canada': 'CAN', 'Cameroon': 'CMR', 'Ghana': 'GHA',
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

// ---------------------------------------------------------------------------
// Poisson helpers (inline, no imports)
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

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function logit(p) {
  const c = Math.max(0.001, Math.min(0.999, p));
  return Math.log(c / (1 - c));
}

// ---------------------------------------------------------------------------
// Step A: Fetch match data
// ---------------------------------------------------------------------------

async function fetchMatches() {
  const urls = [
    `${BASE}/matches/43/3.json`,   // WM 2018
    `${BASE}/matches/43/106.json`, // WM 2022
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
  process.stderr.write(`Total matches loaded: ${results.length}\n`);
  return results;
}

// ---------------------------------------------------------------------------
// Step B+C: IPF to compute attack / defense strengths
// ---------------------------------------------------------------------------

function ipfStrengths(matches) {
  // Gather all teams (FIFA codes)
  const teamsSet = new Set();
  const mapped = [];
  for (const m of matches) {
    const h = TEAM_MAP[m.home];
    const a = TEAM_MAP[m.away];
    if (!h || !a) {
      process.stderr.write(`  SKIP (no mapping): ${m.home} vs ${m.away}\n`);
      continue;
    }
    teamsSet.add(h);
    teamsSet.add(a);
    mapped.push({ h, a, hs: m.hs, as: m.as, stage: m.stage });
  }

  const teams = [...teamsSet].sort();
  process.stderr.write(`\nIPF: ${teams.length} teams, ${mapped.length} matches\n`);

  // Initialize
  const attack  = Object.fromEntries(teams.map(t => [t, 1.0]));
  const defense = Object.fromEntries(teams.map(t => [t, 1.0]));

  // 50 IPF iterations
  for (let iter = 0; iter < 50; iter++) {
    // Update attack
    for (const t of teams) {
      const hMatches = mapped.filter(m => m.h === t);
      const aMatches = mapped.filter(m => m.a === t);
      let num = 0, den = 0;
      for (const m of hMatches) { num += m.hs; den += defense[m.a]; }
      for (const m of aMatches) { num += m.as; den += defense[m.h]; }
      attack[t] = den > 0 ? num / den : 1.0;
    }

    // Normalize attack: geometric mean = 1
    const logMeanA = teams.reduce((s, t) => s + Math.log(Math.max(attack[t], 1e-9)), 0) / teams.length;
    const factorA = Math.exp(logMeanA);
    for (const t of teams) attack[t] = Math.max(attack[t] / factorA, 1e-9);

    // Update defense
    for (const t of teams) {
      const hMatches = mapped.filter(m => m.h === t);
      const aMatches = mapped.filter(m => m.a === t);
      let num = 0, den = 0;
      for (const m of hMatches) { num += m.as; den += attack[m.a]; }
      for (const m of aMatches) { num += m.hs; den += attack[m.h]; }
      defense[t] = den > 0 ? Math.max(num / den, 1e-9) : 1.0;
    }

    // Normalize defense: geometric mean = 1 (separate from attack)
    const logMeanD = teams.reduce((s, t) => s + Math.log(Math.max(defense[t], 1e-9)), 0) / teams.length;
    const factorD = Math.exp(logMeanD);
    for (const t of teams) defense[t] = Math.max(defense[t] / factorD, 1e-9);
  }

  return { teams, attack, defense, mapped };
}

// ---------------------------------------------------------------------------
// Step D: Platt scaling calibration (group stage only)
// ---------------------------------------------------------------------------

function trainCalib(mapped, attack, defense) {
  const groupStageKeywords = ['Group Stage', 'Group', 'group'];
  const samples = mapped.filter(m =>
    groupStageKeywords.some(k => m.stage.toLowerCase().includes(k.toLowerCase()))
  );
  process.stderr.write(`\nCalibration samples (group stage): ${samples.length}\n`);

  const data = [];
  for (const m of samples) {
    const lH = attack[m.h] * 1.3;
    const lA = attack[m.a] * 1.3;
    const { pH, pD, pA } = matchProbs(lH, lA);
    const actual = m.hs > m.as ? 'H' : m.hs === m.as ? 'D' : 'A';
    data.push({ pH, pD, pA, actual });
  }

  // Gradient descent per class
  let aH = 1.0, bH = 0.0;
  let aD = 1.0, bD = 0.0;
  let aA = 1.0, bA = 0.0;
  const lr = 0.02;
  const iters = 200;

  for (let it = 0; it < iters; it++) {
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

      gaH += dH * cH * (1 - cH) * lH_;
      gbH += dH * cH * (1 - cH);
      gaD += dD * cD * (1 - cD) * lD_;
      gbD += dD * cD * (1 - cD);
      gaA += dA * cA * (1 - cA) * lA_;
      gbA += dA * cA * (1 - cA);
    }

    const n = data.length;
    aH -= lr * gaH / n;
    bH -= lr * gbH / n;
    aD -= lr * gaD / n;
    bD -= lr * gbD / n;
    aA -= lr * gaA / n;
    bA -= lr * gbA / n;
  }

  process.stderr.write(`Calibration result: aH=${aH.toFixed(3)} bH=${bH.toFixed(3)} aD=${aD.toFixed(3)} bD=${bD.toFixed(3)} aA=${aA.toFixed(3)} bA=${bA.toFixed(3)}\n`);

  return { aH, bH, aD, bD, aA, bA, n: data.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  process.stderr.write('=== StatsBomb WM Training Pipeline ===\n\n');

  // Fetch all matches
  const allMatches = await fetchMatches();

  // IPF strengths on all matches
  const { teams, attack, defense, mapped } = ipfStrengths(allMatches);

  // Rank teams by attack descending
  const ranked = [...teams].sort((a, b) => attack[b] - attack[a]);
  const rankOf = Object.fromEntries(ranked.map((t, i) => [t, i + 1]));

  // Train calibration
  const calib = trainCalib(mapped, attack, defense);

  // ---------------------------------------------------------------------------
  // Build TS output for NATION_STATS
  // ---------------------------------------------------------------------------
  const statLines = ranked.map(t => {
    const att = (attack[t] * 1.3).toFixed(2);
    const def = (defense[t] * 1.0).toFixed(2);
    const r = rankOf[t];
    return `  ${t}: { rank: ${String(r).padStart(2)}, hGF: ${att}, hGA: ${def}, aGF: ${att}, aGA: ${def} },`;
  });

  const nationStatsSnippet = `// Auto-generiert von scripts/train-from-statsbomb.mjs
// Generiert: ${new Date().toISOString()}
// Trainiert auf WM 2018 + WM 2022 (StatsBomb open data), IPF 50 Iterationen
${statLines.join('\n')}`;

  // ---------------------------------------------------------------------------
  // Build TS output for HARDCODED_CALIB
  // ---------------------------------------------------------------------------
  const calibSnippet = `export const HARDCODED_CALIB: CalibParams = {
  aH: ${calib.aH.toFixed(3)}, bH: ${calib.bH.toFixed(3)},
  aD: ${calib.aD.toFixed(3)}, bD: ${calib.bD.toFixed(3)},
  aA: ${calib.aA.toFixed(3)}, bA: ${calib.bA.toFixed(3)},
  n: ${calib.n},
};`;

  // Write temp files
  const { writeFile } = await import('node:fs/promises');
  await writeFile('/tmp/nation-stats-update.ts', nationStatsSnippet, 'utf8');
  await writeFile('/tmp/hardcoded-calib-update.ts', calibSnippet, 'utf8');
  process.stderr.write('\nWrote /tmp/nation-stats-update.ts\n');
  process.stderr.write('Wrote /tmp/hardcoded-calib-update.ts\n');

  // Print to stdout
  process.stdout.write('\n=== NATION_STATS snippet ===\n');
  process.stdout.write(nationStatsSnippet + '\n');
  process.stdout.write('\n=== HARDCODED_CALIB snippet ===\n');
  process.stdout.write(calibSnippet + '\n');

  // Return structured result for programmatic use
  return { attack, defense, rankOf, calib, teams };
}

main().catch(e => {
  process.stderr.write(`ERROR: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
