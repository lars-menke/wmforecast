/**
 * train-calibration.mjs
 *
 * Trainiert Platt-Scaling-Parameter auf WM 2014 + 2018 + 2022 Daten.
 * Nutzt denselben martj42-CSV-Datensatz wie build-nation-stats.mjs.
 *
 * Usage:
 *   node scripts/train-calibration.mjs
 *   node scripts/train-calibration.mjs --write   (schreibt direkt in calibration.ts)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import https from 'https';

const CSV_PATH = '/tmp/int_results.csv';
const CSV_URL  = 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';

// WM-Turniere die wir für die Kalibrierung nutzen
const WM_TOURNAMENTS = new Set([
  'FIFA World Cup',
]);

// ---------------------------------------------------------------------------
// Poisson-Modell (Mini-Version für Kalibrierung)
// ---------------------------------------------------------------------------

const DC_RHO = -0.13;
const DRAW_BOOST_MAX = 0.12;   // optimierter Wert (Schritt 4)
const DRAW_BOOST_RANGE = 0.40;
const M = 7;
const LAMBDA_MIN = 0.3;
const LAMBDA_MAX = 4.5;

function poissonPmf(k, lambda) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function dcTau(x, y, lH, lA) {
  if (x === 0 && y === 0) return 1 - lH * lA * DC_RHO;
  if (x === 0 && y === 1) return 1 + lH * DC_RHO;
  if (x === 1 && y === 0) return 1 + lA * DC_RHO;
  if (x === 1 && y === 1) return 1 - DC_RHO;
  return 1;
}

function buildMatrix(lH, lA) {
  const mat = [];
  for (let i = 0; i <= M; i++) {
    mat[i] = [];
    for (let j = 0; j <= M; j++) {
      mat[i][j] = poissonPmf(i, lH) * poissonPmf(j, lA) * dcTau(i, j, lH, lA);
    }
  }
  return mat;
}

function rawProbs(mat) {
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i <= M; i++) {
    for (let j = 0; j <= M; j++) {
      const p = mat[i][j];
      if (i > j) pH += p; else if (i === j) pD += p; else pA += p;
    }
  }
  return { pH, pD, pA };
}

function applyDrawBoost(pH, pD, pA, lH, lA) {
  const diff = Math.abs(lH - lA);
  if (diff >= DRAW_BOOST_RANGE) return { pH, pD, pA };
  const boost = DRAW_BOOST_MAX * (1 - diff / DRAW_BOOST_RANGE);
  const take = boost / 2;
  return { pH: Math.max(0, pH - take), pD: pD + boost, pA: Math.max(0, pA - take) };
}

function calcRaw(gfH, gaH, gfA, gaA) {
  const lH = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, gfH * gaA));
  const lA = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, gfA * gaH));
  const mat = buildMatrix(lH, lA);
  let { pH, pD, pA } = rawProbs(mat);
  const b = applyDrawBoost(pH, pD, pA, lH, lA);
  pH = b.pH; pD = b.pD; pA = b.pA;
  const sum = pH + pD + pA;
  return { pH: pH/sum, pD: pD/sum, pA: pA/sum };
}

// ---------------------------------------------------------------------------
// Platt-Scaling via Gradient Descent
// ---------------------------------------------------------------------------

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function logit(p) { return Math.log(Math.max(0.001, Math.min(0.999, p)) / (1 - Math.max(0.001, Math.min(0.999, p)))); }

function applyCalib(pH, pD, pA, aH, bH, aD, bD, aA, bA) {
  const cH = sigmoid(aH * logit(pH) + bH);
  const cD = sigmoid(aD * logit(pD) + bD);
  const cA = sigmoid(aA * logit(pA) + bA);
  const sum = cH + cD + cA;
  return { cH: cH/sum, cD: cD/sum, cA: cA/sum };
}

function logLoss(samples, aH, bH, aD, bD, aA, bA) {
  let loss = 0;
  for (const s of samples) {
    const { cH, cD, cA } = applyCalib(s.pH, s.pD, s.pA, aH, bH, aD, bD, aA, bA);
    const eps = 1e-9;
    if (s.actual === 'H') loss -= Math.log(cH + eps);
    else if (s.actual === 'D') loss -= Math.log(cD + eps);
    else loss -= Math.log(cA + eps);
  }
  return loss / samples.length;
}

function trainCalib(samples) {
  let aH = 1, bH = 0, aD = 1, bD = 0, aA = 1, bA = 0;
  const lr = 0.01;
  const iters = 2000;
  const eps = 1e-5;

  for (let iter = 0; iter < iters; iter++) {
    // Numerische Gradienten
    const base = logLoss(samples, aH, bH, aD, bD, aA, bA);
    const daH = (logLoss(samples, aH+eps, bH, aD, bD, aA, bA) - base) / eps;
    const dbH = (logLoss(samples, aH, bH+eps, aD, bD, aA, bA) - base) / eps;
    const daD = (logLoss(samples, aH, bH, aD+eps, bD, aA, bA) - base) / eps;
    const dbD = (logLoss(samples, aH, bH, aD, bD+eps, aA, bA) - base) / eps;
    const daA = (logLoss(samples, aH, bH, aD, bD, aA+eps, bA) - base) / eps;
    const dbA = (logLoss(samples, aH, bH, aD, bD, aA, bA+eps) - base) / eps;

    aH -= lr * daH; bH -= lr * dbH;
    aD -= lr * daD; bD -= lr * dbD;
    aA -= lr * daA; bA -= lr * dbA;
  }

  return { aH, bH, aD, bD, aA, bA };
}

// ---------------------------------------------------------------------------
// CSV-Parsing + WM-Spiele filtern
// ---------------------------------------------------------------------------

async function downloadCsv() {
  if (existsSync(CSV_PATH)) {
    const stat = readFileSync(CSV_PATH);
    if (stat.length > 100000) {
      process.stderr.write('CSV bereits vorhanden.\n');
      return;
    }
  }
  process.stderr.write('Lade CSV...\n');
  await new Promise((resolve, reject) => {
    const file = createWriteStream(CSV_PATH);
    https.get(CSV_URL, res => pipeline(res, file).then(resolve).catch(reject)).on('error', reject);
  });
}

// Grobe Stats für den Kalibrierungs-Zeitraum (2012-2022, vor WM-Beginn)
// Wir berechnen sie direkt aus dem CSV für die Trainingsperiode
function buildStatsForPeriod(records, beforeDate) {
  const agg = {};
  for (const r of records) {
    if (r.date >= beforeDate) continue;
    if (!r.homeCode || !r.awayCode) continue;
    const w = 1; // kein Decay für Kalibrierung
    const ensure = code => { if (!agg[code]) agg[code] = { gf:0, ga:0, w:0 }; };
    ensure(r.homeCode); ensure(r.awayCode);
    agg[r.homeCode].gf += r.hg*w; agg[r.homeCode].ga += r.ag*w; agg[r.homeCode].w += w;
    agg[r.awayCode].gf += r.ag*w; agg[r.awayCode].ga += r.hg*w; agg[r.awayCode].w += w;
  }
  const stats = {};
  for (const [code, d] of Object.entries(agg)) {
    if (d.w < 5) continue;
    stats[code] = { gf: d.gf/d.w, ga: d.ga/d.w };
  }
  return stats;
}

const NAME_TO_CODE = {
  'Argentina':'ARG','Brazil':'BRA','France':'FRA','England':'ENG','Spain':'ESP',
  'Portugal':'POR','Netherlands':'NED','Germany':'GER','Belgium':'BEL','Uruguay':'URU',
  'Colombia':'COL','Croatia':'CRO','United States':'USA','Mexico':'MEX','Canada':'CAN',
  'Japan':'JPN','South Korea':'KOR','Morocco':'MAR','Senegal':'SEN','Australia':'AUS',
  'Switzerland':'SUI','Denmark':'DEN','Austria':'AUT','Poland':'POL','Serbia':'SRB',
  'Turkey':'TUR','Ukraine':'UKR','Scotland':'SCO','Slovenia':'SVN','Ecuador':'ECU',
  'Venezuela':'VEN','Paraguay':'PAR','Iran':'IRN','Saudi Arabia':'SAU','Qatar':'QAT',
  'Iraq':'IRQ','Jordan':'JOR','Egypt':'EGY','Nigeria':'NGA',"Ivory Coast":'CIV',
  "Côte d'Ivoire":'CIV','Ghana':'GHA','Cameroon':'CMR','Tunisia':'TUN',
  'South Africa':'RSA','New Zealand':'NZL','Jamaica':'JAM','Honduras':'HON','Panama':'PAN',
  'Russia':'RUS','Costa Rica':'CRC','Sweden':'SWE','Switzerland':'SUI',
  'Czech Republic':'CZE','Czechia':'CZE','Algeria':'ALG','Greece':'GRE',
  'Bosnia and Herzegovina':'BIH','Burkina Faso':'BFA','Cape Verde':'CPV',
  'DR Congo':'COD','Uzbekistan':'UZB','Haiti':'HAI',
};

async function main() {
  await downloadCsv();
  const content = readFileSync(CSV_PATH, 'utf-8');
  const lines = content.trim().split('\n');

  const allRecords = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;
    const date = new Date(cols[0].trim());
    if (isNaN(date.getTime())) continue;
    allRecords.push({
      date,
      home: cols[1].trim(),
      away: cols[2].trim(),
      homeCode: NAME_TO_CODE[cols[1].trim()],
      awayCode: NAME_TO_CODE[cols[2].trim()],
      hg: parseInt(cols[3].trim(), 10),
      ag: parseInt(cols[4].trim(), 10),
      tournament: cols[5].trim(),
    });
  }

  // WM 2014 (Brasilien), 2018 (Russland), 2022 (Katar)
  const wmYears = [
    { start: new Date('2014-06-12'), end: new Date('2014-07-14') },
    { start: new Date('2018-06-14'), end: new Date('2018-07-15') },
    { start: new Date('2022-11-20'), end: new Date('2022-12-18') },
  ];

  const samples = [];
  let skipped = 0;

  for (const wm of wmYears) {
    const wmGames = allRecords.filter(r =>
      r.date >= wm.start && r.date <= wm.end &&
      WM_TOURNAMENTS.has(r.tournament) &&
      r.homeCode && r.awayCode &&
      !isNaN(r.hg) && !isNaN(r.ag)
    );

    // Stats aus allen Spielen VOR diesem Turnier (bis Turnierbeginn)
    const statsMap = buildStatsForPeriod(allRecords, wm.start);

    for (const g of wmGames) {
      const hStats = statsMap[g.homeCode];
      const aStats = statsMap[g.awayCode];
      if (!hStats || !aStats) { skipped++; continue; }

      const { pH, pD, pA } = calcRaw(hStats.gf, hStats.ga, aStats.gf, aStats.ga);
      const actual = g.hg > g.ag ? 'H' : g.hg === g.ag ? 'D' : 'A';
      samples.push({ pH, pD, pA, actual });
    }
  }

  process.stderr.write(`Kalibrierungs-Samples: ${samples.length} (übersprungen: ${skipped})\n`);

  if (samples.length < 20) {
    process.stderr.write('Zu wenige Samples! Prüfe CSV-Daten.\n');
    process.exit(1);
  }

  const params = trainCalib(samples);
  const n = samples.length;

  const result = {
    aH: +params.aH.toFixed(3),
    bH: +params.bH.toFixed(3),
    aD: +params.aD.toFixed(3),
    bD: +params.bD.toFixed(3),
    aA: +params.aA.toFixed(3),
    bA: +params.bA.toFixed(3),
    n,
  };

  process.stderr.write(`Trainierte Parameter: ${JSON.stringify(result, null, 2)}\n`);

  const finalLoss = logLoss(samples, result.aH, result.bH, result.aD, result.bD, result.aA, result.bA);
  process.stderr.write(`Log-Loss nach Kalibrierung: ${finalLoss.toFixed(4)}\n`);
  const uncalibLoss = logLoss(samples, 1, 0, 1, 0, 1, 0);
  process.stderr.write(`Log-Loss ohne Kalibrierung: ${uncalibLoss.toFixed(4)}\n`);

  const writeMode = process.argv.includes('--write');
  if (writeMode) {
    const calibPath = new URL('../src/lib/calibration.ts', import.meta.url).pathname;
    let src = readFileSync(calibPath, 'utf-8');
    const newConst = `export const HARDCODED_CALIB: CalibParams = {\n  aH: ${result.aH}, bH: ${result.bH},\n  aD: ${result.aD}, bD: ${result.bD},\n  aA: ${result.aA}, bA: ${result.bA},\n  n: ${n},\n};`;
    src = src.replace(/export const HARDCODED_CALIB[^;]+;/s, newConst);
    writeFileSync(calibPath, src, 'utf-8');
    process.stderr.write('calibration.ts aktualisiert.\n');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
