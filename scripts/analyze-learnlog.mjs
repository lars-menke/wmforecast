#!/usr/bin/env node
// Wertet ein exportiertes Lernprotokoll aus:
//   1. Alpha-Sweep der Markt-Gewichtung (Log-Loss, Brier, Trefferquote)
//   2. Dissens-Analyse: wie enden Spiele, bei denen Modell und Markt
//      unterschiedliche Sieger favorisieren? (Remis-Signal-Hypothese)
// Unterstützt beide Formate: v1 (flach) und v2 (Zeitreihe; nutzt den
// jeweils letzten Snapshot vor Anpfiff).
//
// Usage: node scripts/analyze-learnlog.mjs <pfad-zum-export.json>

import { readFileSync } from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/analyze-learnlog.mjs <learnlog.json>');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, 'utf8'));

// Normalisieren: v2-Einträge (mit snapshots[]) auf letzten Snapshot reduzieren
const entries = raw
  .map(e => {
    if (Array.isArray(e.snapshots)) {
      const last = e.snapshots[e.snapshots.length - 1];
      return last ? { matchId: e.matchId, actual: e.actual, ...last } : null;
    }
    return e;
  })
  .filter(e => e && e.actual !== null && e.actual !== undefined);

console.log(`Auswertbare Spiele (mit Ergebnis): ${entries.length}\n`);
if (entries.length === 0) process.exit(0);

// --- Poisson + Dixon-Coles (identisch zu src/lib/poisson.ts) ---
const RHO = -0.13, M = 7;
function pmf(k, l) { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; }
function dcTau(x, y, lH, lA) {
  if (x === 0 && y === 0) return 1 - lH * lA * RHO;
  if (x === 0 && y === 1) return 1 + lH * RHO;
  if (x === 1 && y === 0) return 1 + lA * RHO;
  if (x === 1 && y === 1) return 1 - RHO;
  return 1;
}
function probs(lH, lA) {
  let pH = 0, pD = 0, pA = 0;
  for (let x = 0; x <= M; x++) for (let y = 0; y <= M; y++) {
    const p = pmf(x, lH) * pmf(y, lA) * dcTau(x, y, lH, lA);
    if (x > y) pH += p; else if (x === y) pD += p; else pA += p;
  }
  const s = pH + pD + pA;
  return [pH / s, pD / s, pA / s];
}

const clamp = l => Math.max(0.3, Math.min(4.5, l));
const idx = { H: 0, D: 1, A: 2 };

// Markt-Lambda aus Blend rekonstruieren (Blend wurde mit alpha=0.5 geschrieben)
function lambdaAt(model, blend, a) {
  const mkt = 2 * blend - model;
  return clamp(model + a * (mkt - model));
}

// --- 1. Alpha-Sweep ---
function evalAlpha(a) {
  let ll = 0, br = 0, acc = 0;
  for (const m of entries) {
    const p = probs(lambdaAt(m.lH_model, m.lH_blend, a), lambdaAt(m.lA_model, m.lA_blend, a));
    const t = idx[m.actual];
    ll += -Math.log(Math.max(1e-9, p[t]));
    for (let k = 0; k < 3; k++) br += (p[k] - (k === t ? 1 : 0)) ** 2;
    if (p.indexOf(Math.max(...p)) === t) acc++;
  }
  const n = entries.length;
  return { ll: ll / n, br: br / n, acc: acc / n };
}

console.log('=== Alpha-Sweep (Markt-Gewichtung) ===');
console.log('alpha | LogLoss | Brier  | Trefferquote');
let best = { a: 0, ll: Infinity };
for (let a = 0; a <= 1.0001; a += 0.1) {
  const r = evalAlpha(a);
  if (r.ll < best.ll) best = { a, ...r };
  console.log(`${a.toFixed(1)}   | ${r.ll.toFixed(4)}  | ${r.br.toFixed(4)} | ${(r.acc * 100).toFixed(1)}%`);
}
let fine = { a: 0, ll: Infinity };
for (let a = 0; a <= 1.0001; a += 0.02) {
  const r = evalAlpha(a);
  if (r.ll < fine.ll) fine = { a, ...r };
}
console.log(`\nOptimum (grob): alpha=${best.a.toFixed(1)}  |  Optimum (fein): alpha=${fine.a.toFixed(2)}, LogLoss=${fine.ll.toFixed(4)}`);

// --- 2. Dissens-Analyse (Remis-Signal-Hypothese) ---
console.log('\n=== Dissens-Analyse: Modell vs. Markt uneinig über den Sieger ===');
let dis = 0, modelRight = 0, marketRight = 0, draws = 0;
for (const m of entries) {
  const [pH, , pA] = probs(clamp(m.lH_model), clamp(m.lA_model));
  const modelW = pH >= pA ? 'H' : 'A';
  const marketW = m.oddsH >= m.oddsA ? 'H' : 'A';
  if (modelW === marketW) continue;
  dis++;
  const tag = m.actual === 'D' ? 'REMIS' : m.actual === modelW ? 'Modell richtig' : 'Markt richtig';
  if (m.actual === 'D') draws++;
  else if (m.actual === modelW) modelRight++;
  else marketRight++;
  console.log(`  ${m.matchId.padEnd(10)} Modell:${modelW} Markt:${marketW} -> ${m.actual} (${tag})`);
}
const einig = entries.length - dis;
const einigDraws = entries.filter(m => {
  const [pH, , pA] = probs(clamp(m.lH_model), clamp(m.lA_model));
  const modelW = pH >= pA ? 'H' : 'A';
  const marketW = m.oddsH >= m.oddsA ? 'H' : 'A';
  return modelW === marketW && m.actual === 'D';
}).length;

console.log(`\nDissens-Spiele: ${dis}  ->  Modell ${modelRight} | Markt ${marketRight} | Remis ${draws} (${dis ? (draws / dis * 100).toFixed(0) : 0}%)`);
console.log(`Einigkeit-Spiele: ${einig}  ->  davon Remis ${einigDraws} (${einig ? (einigDraws / einig * 100).toFixed(0) : 0}%)`);
console.log('\nHypothese "Dissens = Remis-Signal" bestätigt sich, wenn die Remis-Quote');
console.log('bei Dissens deutlich über der Remis-Quote bei Einigkeit liegt.');
