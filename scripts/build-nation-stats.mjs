/**
 * build-nation-stats.mjs
 *
 * Berechnet NATION_STATS aus internationalen Länderspielergebnissen.
 * Datenquelle: https://github.com/martj42/international_results (public domain CSV)
 *
 * Usage:
 *   node scripts/build-nation-stats.mjs
 *
 * Gibt die berechneten Stats auf stdout aus (als TypeScript-Code-Block).
 * Ergebnisse manuell in src/lib/nations.ts einfügen oder mit --write direkt schreiben.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import https from 'https';

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const DECAY_HALF_LIFE_DAYS = 365; // 1 Jahr Halbwertszeit
const DECAY_BASE = Math.pow(0.5, 1 / DECAY_HALF_LIFE_DAYS);

const REFERENCE_DATE = new Date('2026-06-11'); // WM-Beginn
const CUTOFF_DATE    = new Date('2021-01-01'); // Keine Spiele vor 2021 berücksichtigen
const MIN_MATCHES    = 5;                       // Mindestspiele für valide Stats

const CSV_URL  = 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';
const CSV_PATH = '/tmp/int_results.csv';

// ---------------------------------------------------------------------------
// FIFA-Code-Mapping (Ländername → 3-Letter-Code)
// ---------------------------------------------------------------------------

const NAME_TO_CODE = {
  'Argentina': 'ARG', 'Brazil': 'BRA', 'France': 'FRA', 'England': 'ENG',
  'Spain': 'ESP', 'Portugal': 'POR', 'Netherlands': 'NED', 'Germany': 'GER',
  'Belgium': 'BEL', 'Uruguay': 'URU', 'Colombia': 'COL', 'Croatia': 'CRO',
  'United States': 'USA', 'Mexico': 'MEX', 'Canada': 'CAN', 'Japan': 'JPN',
  'South Korea': 'KOR', 'Morocco': 'MAR', 'Senegal': 'SEN', 'Australia': 'AUS',
  'Switzerland': 'SUI', 'Denmark': 'DEN', 'Austria': 'AUT', 'Poland': 'POL',
  'Serbia': 'SRB', 'Turkey': 'TUR', 'Ukraine': 'UKR', 'Scotland': 'SCO',
  'Slovenia': 'SVN', 'Ecuador': 'ECU', 'Venezuela': 'VEN', 'Paraguay': 'PAR',
  'Iran': 'IRN', 'Saudi Arabia': 'SAU', 'Qatar': 'QAT', 'Iraq': 'IRQ',
  'Jordan': 'JOR', 'Egypt': 'EGY', 'Nigeria': 'NGA', "Ivory Coast": 'CIV',
  "Côte d'Ivoire": 'CIV', 'Ghana': 'GHA', 'Cameroon': 'CMR', 'Tunisia': 'TUN',
  'South Africa': 'RSA', 'New Zealand': 'NZL', 'Jamaica': 'JAM', 'Honduras': 'HON',
  'Panama': 'PAN', 'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Bosnia and Herzegovina': 'BIH', 'Sweden': 'SWE', 'Norway': 'NOR',
  'Algeria': 'ALG', 'Cape Verde': 'CPV', 'DR Congo': 'COD',
  'Democratic Republic of the Congo': 'COD', 'Uzbekistan': 'UZB',
  'Haiti': 'HAI', 'Curacao': 'CUW', 'Curaçao': 'CUW',
};

// FIFA-Weltrangliste (ungefähr, Stand Juni 2026)
const FIFA_RANK = {
  ARG: 1, FRA: 2, ENG: 3, ESP: 4, BRA: 5, POR: 6, NED: 7, GER: 8,
  URU: 9, COL: 10, BEL: 11, USA: 12, MEX: 13, MAR: 14, JPN: 15,
  CAN: 16, SEN: 17, CRO: 18, SUI: 19, AUT: 20, DEN: 21, UKR: 22,
  IRN: 23, AUS: 24, SRB: 25, TUR: 26, KOR: 27, POL: 28, ECU: 29,
  SCO: 30, SVN: 31, CIV: 32, SAU: 33, NGA: 34, EGY: 35, PAR: 36,
  CMR: 37, GHA: 38, TUN: 39, VEN: 40, PAN: 41, IRQ: 42, QAT: 43,
  RSA: 44, JAM: 45, JOR: 46, HON: 47, NZL: 48, CZE: 28, BIH: 36,
  SWE: 25, NOR: 27, ALG: 35, CPV: 46, COD: 40, UZB: 44, HAI: 48, CUW: 47,
};

// ---------------------------------------------------------------------------
// CSV herunterladen
// ---------------------------------------------------------------------------

async function downloadCsv() {
  if (existsSync(CSV_PATH)) {
    const stat = readFileSync(CSV_PATH);
    if (stat.length > 100000) {
      process.stderr.write('CSV bereits vorhanden, überspringe Download.\n');
      return;
    }
  }
  process.stderr.write('Lade CSV herunter...\n');
  await new Promise((resolve, reject) => {
    const file = createWriteStream(CSV_PATH);
    https.get(CSV_URL, res => {
      pipeline(res, file).then(resolve).catch(reject);
    }).on('error', reject);
  });
  process.stderr.write('Download abgeschlossen.\n');
}

// ---------------------------------------------------------------------------
// CSV parsen
// ---------------------------------------------------------------------------

function parseCsv(content) {
  const lines = content.trim().split('\n');
  // Header: date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;
    const date = new Date(cols[0].trim());
    if (isNaN(date.getTime())) continue;
    if (date < CUTOFF_DATE || date > REFERENCE_DATE) continue;
    records.push({
      date,
      home: cols[1].trim(),
      away: cols[2].trim(),
      hg: parseInt(cols[3].trim(), 10),
      ag: parseInt(cols[4].trim(), 10),
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Decay-Gewicht berechnen
// ---------------------------------------------------------------------------

function decayWeight(matchDate) {
  const daysDiff = (REFERENCE_DATE - matchDate) / 86400000;
  return Math.pow(DECAY_BASE, daysDiff);
}

// ---------------------------------------------------------------------------
// Stats aggregieren
// ---------------------------------------------------------------------------

function buildStats(records) {
  // team -> { gfSum, gaSum, weightSum, matchCount }
  const agg = {};

  function ensure(code) {
    if (!agg[code]) agg[code] = { gfSum: 0, gaSum: 0, weightSum: 0, matchCount: 0 };
  }

  for (const r of records) {
    const hCode = NAME_TO_CODE[r.home];
    const aCode = NAME_TO_CODE[r.away];
    if (!hCode || !aCode) continue;
    if (isNaN(r.hg) || isNaN(r.ag)) continue;

    const w = decayWeight(r.date);

    ensure(hCode);
    agg[hCode].gfSum     += r.hg * w;
    agg[hCode].gaSum     += r.ag * w;
    agg[hCode].weightSum += w;
    agg[hCode].matchCount++;

    ensure(aCode);
    agg[aCode].gfSum     += r.ag * w;
    agg[aCode].gaSum     += r.hg * w;
    agg[aCode].weightSum += w;
    agg[aCode].matchCount++;
  }

  const stats = {};
  for (const [code, d] of Object.entries(agg)) {
    if (d.matchCount < MIN_MATCHES) continue;
    const gf = d.gfSum / d.weightSum;
    const ga = d.gaSum / d.weightSum;
    stats[code] = {
      rank: FIFA_RANK[code] ?? 50,
      hGF: +gf.toFixed(2),
      hGA: +ga.toFixed(2),
      aGF: +gf.toFixed(2),
      aGA: +ga.toFixed(2),
    };
  }
  return stats;
}

// ---------------------------------------------------------------------------
// TypeScript-Code generieren
// ---------------------------------------------------------------------------

function generateTs(stats) {
  const teams = Object.keys(FIFA_RANK);
  const lines = [];
  for (const code of teams) {
    const s = stats[code];
    if (!s) {
      lines.push(`  // ${code}: keine ausreichenden Daten — Fallback nötig`);
      continue;
    }
    const rank = String(s.rank).padStart(2);
    lines.push(
      `  ${code}: { rank: ${rank}, hGF: ${s.hGF.toFixed(2)}, hGA: ${s.hGA.toFixed(2)}, aGF: ${s.hGF.toFixed(2)}, aGA: ${s.hGA.toFixed(2)} },`
    );
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await downloadCsv();
  const content = readFileSync(CSV_PATH, 'utf-8');
  const records = parseCsv(content);
  process.stderr.write(`Verarbeitete Spiele: ${records.length}\n`);

  const stats = buildStats(records);
  process.stderr.write(`Teams mit validen Stats: ${Object.keys(stats).length}\n`);

  const writeMode = process.argv.includes('--write');

  if (writeMode) {
    // Direkt in nations.ts schreiben — Platzhalter-Kommentar suchen
    const nationsPath = new URL('../src/lib/nations.ts', import.meta.url).pathname;
    let src = readFileSync(nationsPath, 'utf-8');
    const marker = /export const NATION_STATS[^=]+=\s*\{[^}]*\};/s;
    const newBlock = `export const NATION_STATS: Record<string, TeamStats> = {\n${generateTs(stats)}\n};`;
    if (marker.test(src)) {
      src = src.replace(marker, newBlock);
      writeFileSync(nationsPath, src, 'utf-8');
      process.stderr.write('nations.ts aktualisiert.\n');
    } else {
      process.stderr.write('Marker nicht gefunden — manuelles Einfügen nötig.\n');
      process.stdout.write(newBlock + '\n');
    }
  } else {
    process.stdout.write(generateTs(stats) + '\n');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
