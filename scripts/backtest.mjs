/**
 * backtest.mjs
 *
 * Optimiert DRAW_BOOST_MAX via Grid-Search auf WM 2014+2018+2022 Daten.
 * Minimiert Brier Score und Log-Loss.
 *
 * Usage:
 *   node scripts/backtest.mjs
 *   node scripts/backtest.mjs --write   (schreibt optimalen Wert in poisson.ts)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import https from 'https';

const CSV_PATH = '/tmp/int_results.csv';
const CSV_URL  = 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';

const DC_RHO = -0.13;
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
  if (x===0 && y===0) return 1 - lH*lA*DC_RHO;
  if (x===0 && y===1) return 1 + lH*DC_RHO;
  if (x===1 && y===0) return 1 + lA*DC_RHO;
  if (x===1 && y===1) return 1 - DC_RHO;
  return 1;
}
function rawProbs(lH, lA) {
  let pH=0, pD=0, pA=0;
  for (let i=0; i<=M; i++) for (let j=0; j<=M; j++) {
    const p = poissonPmf(i,lH)*poissonPmf(j,lA)*dcTau(i,j,lH,lA);
    if (i>j) pH+=p; else if (i===j) pD+=p; else pA+=p;
  }
  return { pH, pD, pA };
}
function withBoost(pH, pD, pA, lH, lA, boostMax) {
  const diff = Math.abs(lH - lA);
  if (diff >= DRAW_BOOST_RANGE) return { pH, pD, pA };
  const boost = boostMax * (1 - diff / DRAW_BOOST_RANGE);
  const take = boost / 2;
  return { pH: Math.max(0, pH-take), pD: pD+boost, pA: Math.max(0, pA-take) };
}
function calcProbs(gfH, gaH, gfA, gaA, boostMax) {
  const lH = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, gfH * gaA));
  const lA = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, gfA * gaH));
  let { pH, pD, pA } = rawProbs(lH, lA);
  const b = withBoost(pH, pD, pA, lH, lA, boostMax);
  pH=b.pH; pD=b.pD; pA=b.pA;
  const sum = pH+pD+pA;
  return { pH: pH/sum, pD: pD/sum, pA: pA/sum };
}

function brierScore(samples, boostMax) {
  let score = 0;
  for (const s of samples) {
    const { pH, pD, pA } = calcProbs(s.gfH, s.gaH, s.gfA, s.gaA, boostMax);
    const oH = s.actual==='H' ? 1 : 0;
    const oD = s.actual==='D' ? 1 : 0;
    const oA = s.actual==='A' ? 1 : 0;
    score += (pH-oH)**2 + (pD-oD)**2 + (pA-oA)**2;
  }
  return score / samples.length;
}

function logLoss(samples, boostMax) {
  let loss = 0;
  for (const s of samples) {
    const { pH, pD, pA } = calcProbs(s.gfH, s.gaH, s.gfA, s.gaA, boostMax);
    const eps = 1e-9;
    if (s.actual==='H') loss -= Math.log(pH+eps);
    else if (s.actual==='D') loss -= Math.log(pD+eps);
    else loss -= Math.log(pA+eps);
  }
  return loss / samples.length;
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
  'Russia':'RUS','Costa Rica':'CRC','Czech Republic':'CZE','Czechia':'CZE',
  'Algeria':'ALG','Greece':'GRE','Bosnia and Herzegovina':'BIH',
};

async function downloadCsv() {
  if (existsSync(CSV_PATH)) { const s = readFileSync(CSV_PATH); if (s.length>100000) return; }
  await new Promise((res,rej) => {
    const file = createWriteStream(CSV_PATH);
    https.get(CSV_URL, r => pipeline(r,file).then(res).catch(rej)).on('error',rej);
  });
}

function buildStatsForPeriod(records, beforeDate) {
  const agg = {};
  for (const r of records) {
    if (r.date >= beforeDate || !r.homeCode || !r.awayCode) continue;
    const ensure = c => { if (!agg[c]) agg[c]={gf:0,ga:0,w:0}; };
    ensure(r.homeCode); ensure(r.awayCode);
    agg[r.homeCode].gf+=r.hg; agg[r.homeCode].ga+=r.ag; agg[r.homeCode].w++;
    agg[r.awayCode].gf+=r.ag; agg[r.awayCode].ga+=r.hg; agg[r.awayCode].w++;
  }
  const stats = {};
  for (const [c,d] of Object.entries(agg)) if (d.w>=5) stats[c]={gf:d.gf/d.w, ga:d.ga/d.w};
  return stats;
}

async function main() {
  await downloadCsv();
  const content = readFileSync(CSV_PATH, 'utf-8');
  const lines = content.trim().split('\n');
  const allRecords = [];
  for (let i=1; i<lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length<6) continue;
    const date = new Date(cols[0].trim());
    if (isNaN(date.getTime())) continue;
    allRecords.push({
      date, home: cols[1].trim(), away: cols[2].trim(),
      homeCode: NAME_TO_CODE[cols[1].trim()], awayCode: NAME_TO_CODE[cols[2].trim()],
      hg: parseInt(cols[3],10), ag: parseInt(cols[4],10), tournament: cols[5].trim(),
    });
  }

  const wmYears = [
    { start: new Date('2014-06-12'), end: new Date('2014-07-14') },
    { start: new Date('2018-06-14'), end: new Date('2018-07-15') },
    { start: new Date('2022-11-20'), end: new Date('2022-12-18') },
  ];

  const samples = [];
  for (const wm of wmYears) {
    const statsMap = buildStatsForPeriod(allRecords, wm.start);
    const games = allRecords.filter(r =>
      r.date>=wm.start && r.date<=wm.end && r.tournament==='FIFA World Cup' &&
      r.homeCode && r.awayCode && !isNaN(r.hg) && !isNaN(r.ag)
    );
    for (const g of games) {
      const h = statsMap[g.homeCode], a = statsMap[g.awayCode];
      if (!h || !a) continue;
      samples.push({ gfH:h.gf, gaH:h.ga, gfA:a.gf, gaA:a.ga,
        actual: g.hg>g.ag?'H':g.hg===g.ag?'D':'A' });
    }
  }

  process.stderr.write(`Backtest-Samples: ${samples.length}\n`);

  // Grid Search: 0.00 bis 0.25 in 0.01-Schritten
  const results = [];
  for (let boost = 0; boost <= 0.25; boost = +(boost + 0.01).toFixed(2)) {
    results.push({
      boost,
      brier: brierScore(samples, boost),
      logLoss: logLoss(samples, boost),
    });
  }

  results.sort((a,b) => a.logLoss - b.logLoss);
  const best = results[0];

  process.stderr.write('\nTop 5 nach Log-Loss:\n');
  for (const r of results.slice(0,5)) {
    process.stderr.write(`  boost=${r.boost.toFixed(2)}  brier=${r.brier.toFixed(4)}  logLoss=${r.logLoss.toFixed(4)}\n`);
  }
  process.stderr.write(`\nOptimaler DRAW_BOOST_MAX: ${best.boost}\n`);

  if (process.argv.includes('--write')) {
    const poissonPath = new URL('../src/lib/poisson.ts', import.meta.url).pathname;
    let src = readFileSync(poissonPath, 'utf-8');
    src = src.replace(/const DRAW_BOOST_MAX\s*=\s*[\d.]+;/, `const DRAW_BOOST_MAX = ${best.boost};`);
    writeFileSync(poissonPath, src, 'utf-8');
    process.stderr.write('poisson.ts aktualisiert.\n');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
