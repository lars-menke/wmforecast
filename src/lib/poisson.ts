// Poisson-Modell + Dixon-Coles, neutral ground

import { applyCalib, shrinkToMean, type CalibParams } from './calibration';

export type TeamStats = {
  rank: number;
  hGF: number; hGA: number;
  aGF: number; aGA: number;
};

export type MarketProbs = { h: number; d: number; a: number };
export type Outcome = 'H' | 'D' | 'A';

export type CalcResult = {
  pH: number; pD: number; pA: number;
  naturalTipp: string | null;
  wo: Outcome;
  srt: Array<[string, number]>;
  lH: number; lA: number;
  lH_model: number; lA_model: number;
  fp: number;
  drawBlocked: boolean;
  lambdaDiff: number;
  marketApplied: boolean;
  calibrated: boolean;
  knockout: boolean; // K.o.-Spiel: Tipp ist immer entscheidend (inkl. Elfmeterschießen)
};

// ---------------------------------------------------------------------------
// Modell-Konstanten
// ---------------------------------------------------------------------------

const DC_RHO      = -0.13;
const M           = 7;    // max Tore pro Team in der Matrix
const LAMBDA_MIN  = 0.3;
const LAMBDA_MAX  = 4.5;
const MARKET_BLEND = 0.5;

// ---------------------------------------------------------------------------
// Dixon-Coles tau-Korrektur
// ---------------------------------------------------------------------------

function dcTau(x: number, y: number, lH: number, lA: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lH * lA * rho;
  if (x === 0 && y === 1) return 1 + lH * rho;
  if (x === 1 && y === 0) return 1 + lA * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

// ---------------------------------------------------------------------------
// Poisson-PMF
// ---------------------------------------------------------------------------

function poissonPmf(k: number, lambda: number): number {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// ---------------------------------------------------------------------------
// Tormatrix berechnen
// ---------------------------------------------------------------------------

function buildMatrix(lH: number, lA: number): number[][] {
  const mat: number[][] = [];
  for (let i = 0; i <= M; i++) {
    mat[i] = [];
    for (let j = 0; j <= M; j++) {
      mat[i][j] = poissonPmf(i, lH) * poissonPmf(j, lA) * dcTau(i, j, lH, lA, DC_RHO);
    }
  }
  return mat;
}

// ---------------------------------------------------------------------------
// Rohwahrscheinlichkeiten aus Matrix
// ---------------------------------------------------------------------------

function rawProbs(mat: number[][]): { pH: number; pD: number; pA: number } {
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i <= M; i++) {
    for (let j = 0; j <= M; j++) {
      const p = mat[i][j];
      if (i > j) pH += p;
      else if (i === j) pD += p;
      else pA += p;
    }
  }
  return { pH, pD, pA };
}

// ---------------------------------------------------------------------------
// Effektive Lambdas (neutral ground: Durchschnitt aus Heim/Auswaerts)
// ---------------------------------------------------------------------------

function effectiveLambdas(hStats: TeamStats, aStats: TeamStats): { lH: number; lA: number } {
  const hAtt = (hStats.hGF + hStats.aGF) / 2;
  const hDef = (hStats.hGA + hStats.aGA) / 2;
  const aAtt = (aStats.hGF + aStats.aGF) / 2;
  const aDef = (aStats.hGA + aStats.aGA) / 2;
  const lH = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, hAtt * aDef));
  const lA = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, aAtt * hDef));
  return { lH, lA };
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Wahrscheinlichkeiten + Matrix aus Lambdas
// ---------------------------------------------------------------------------

function calcFromLambdas(lH: number, lA: number): { mat: number[][]; pH: number; pD: number; pA: number } {
  const mat = buildMatrix(
    Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lH)),
    Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lA)),
  );
  const { pH, pD, pA } = rawProbs(mat);
  const sum = pH + pD + pA;
  return { mat, pH: pH / sum, pD: pD / sum, pA: pA / sum };
}

// Drops the matrix from the return value — used in NR inner loop where only probs are needed
function calcProbsFromLambdas(lH: number, lA: number): { pH: number; pD: number; pA: number } {
  const { pH, pD, pA } = calcFromLambdas(lH, lA);
  return { pH, pD, pA };
}

// ---------------------------------------------------------------------------
// Newton-Raphson Marktkorrektur
// Passt lH und lA iterativ an, sodass P(H) und P(A) den Marktquoten entsprechen.
// ---------------------------------------------------------------------------

function applyMarketCorrection(
  lH: number, lA: number,
  market: MarketProbs,
  iters = 12,
  damp  = 0.5,
): { lH: number; lA: number; mat: number[][] } {
  const mH = market.h / 100;
  const mA = market.a / 100;

  // Degenerierte Marktdaten abfangen
  if (mH <= 0.02 || mA <= 0.02 || mH + mA > 0.98) {
    return { lH, lA, mat: buildMatrix(lH, lA) };
  }

  let xH = 1.0; // Multiplikator für lH
  let xA = 1.0; // Multiplikator für lA
  const eps = 1e-4;

  for (let iter = 0; iter < iters; iter++) {
    const { pH: pH0, pA: pA0 } = calcProbsFromLambdas(lH * xH, lA * xA);
    const f1 = pH0 - mH;
    const f2 = pA0 - mA;
    if (Math.abs(f1) < 1e-5 && Math.abs(f2) < 1e-5) break;

    // Numerischer Jacobian
    const { pH: pH_h, pA: pA_h } = calcProbsFromLambdas(lH * (xH + eps), lA * xA);
    const { pH: pH_a, pA: pA_a } = calcProbsFromLambdas(lH * xH, lA * (xA + eps));
    const J11 = (pH_h - pH0) / eps;
    const J12 = (pH_a - pH0) / eps;
    const J21 = (pA_h - pA0) / eps;
    const J22 = (pA_a - pA0) / eps;

    const det = J11 * J22 - J12 * J21;
    if (Math.abs(det) < 1e-10) break;

    xH += damp * (-f1 * J22 + f2 * J12) / det;
    xA += damp * ( f1 * J21 - f2 * J11) / det;
    xH = Math.max(0.4, Math.min(2.5, xH));
    xA = Math.max(0.4, Math.min(2.5, xA));
  }

  const lH_adj = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lH * xH));
  const lA_adj = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lA * xA));

  const lH_blended = lH * (1 - MARKET_BLEND) + lH_adj * MARKET_BLEND;
  const lA_blended = lA * (1 - MARKET_BLEND) + lA_adj * MARKET_BLEND;
  const lH_final = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lH_blended));
  const lA_final = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, lA_blended));
  return { lH: lH_final, lA: lA_final, mat: buildMatrix(lH_final, lA_final) };
}

// ---------------------------------------------------------------------------
// Wahrscheinlichstes Ergebnis und sortierte Ergebnisliste
// ---------------------------------------------------------------------------

function topResults(mat: number[][]): Array<[string, number]> {
  const results: Array<[string, number]> = [];
  for (let i = 0; i <= M; i++) {
    for (let j = 0; j <= M; j++) {
      results.push([`${i}:${j}`, mat[i][j]]);
    }
  }
  results.sort((a, b) => b[1] - a[1]);
  return results;
}

// ---------------------------------------------------------------------------
// Hauptberechnung fur ein Spiel
// ---------------------------------------------------------------------------

export type MatchInput = {
  id: string;
  home: string;
  away: string;
  p: MarketProbs | null;
  knockout?: boolean;
};

export function calcMatch(
  home: string,
  away: string,
  allStats: Record<string, TeamStats>,
  market: MarketProbs | null = null,
  calib: CalibParams | null = null,
  knockout = false,
): CalcResult | null {
  const hStats = allStats[home];
  const aStats = allStats[away];
  if (!hStats || !aStats) return null;

  let { lH, lA } = effectiveLambdas(hStats, aStats);
  const lH_model = lH;
  const lA_model = lA;
  let marketApplied = false;
  let mat: number[][];

  if (market) {
    const corrected = applyMarketCorrection(lH, lA, market);
    lH = corrected.lH;
    lA = corrected.lA;
    mat = corrected.mat;
    marketApplied = true;
  } else {
    mat = buildMatrix(lH, lA);
  }

  // Roh-Wahrscheinlichkeiten aus der Tormatrix (auf Summe 1 normiert)
  let { pH, pD, pA } = rawProbs(mat);
  const sum = pH + pD + pA;
  pH /= sum; pD /= sum; pA /= sum;

  // Kalibrierung (Platt-Scaling). Reicht die Stichprobe nicht, Shrink zum Prior.
  let calibrated = false;
  if (calib) {
    if (calib.n >= 45) {
      ({ pH, pD, pA } = applyCalib(pH, pD, pA, calib));
      calibrated = true;
    } else {
      ({ pH, pD, pA } = shrinkToMean(pH, pD, pA));
    }
  }

  // Alle abgeleiteten Felder aus den FINALEN (ggf. kalibrierten) Werten.
  // Die Tormatrix/srt bleibt unkalibriert — Platt-Scaling betrifft nur 1X2,
  // nicht die Ergebnisverteilung. naturalTipp wählt aus srt das zum
  // kalibrierten Ausgang (wo) passende, wahrscheinlichste Ergebnis.
  const srt = topResults(mat);
  let fp = Math.max(pH, pD, pA);
  let wo: Outcome = pH >= pD && pH >= pA ? 'H' : pD >= pA ? 'D' : 'A';

  // K.o.-Spiele enden spätestens im Elfmeterschießen — kein Remis-Tipp.
  // Weiterkommen = Sieg in 90 Min + halbe Remis-Wahrscheinlichkeit (Shootout 50/50).
  if (knockout) {
    wo = pH >= pA ? 'H' : 'A';
    fp = Math.max(pH, pA) + pD / 2;
  }

  const naturalTipp = deriveNaturalTipp(srt, wo);
  const lambdaDiff = lH - lA;

  return {
    pH, pD, pA,
    naturalTipp,
    wo,
    srt,
    lH, lA,
    lH_model, lA_model,
    fp,
    drawBlocked: false,
    lambdaDiff,
    marketApplied,
    calibrated,
    knockout,
  };
}

export function deriveNaturalTipp(srt: Array<[string, number]>, wo: Outcome): string | null {
  const filtered = srt.filter(([score]) => {
    const [g1, g2] = score.split(':').map(Number);
    if (wo === 'H') return g1 > g2;
    if (wo === 'A') return g1 < g2;
    return g1 === g2;
  });
  return filtered.length > 0 ? filtered[0][0] : srt[0]?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Batch-Berechnung fur alle Spiele
// ---------------------------------------------------------------------------

export function recalcMatches(
  inputs: MatchInput[],
  allStats: Record<string, TeamStats>,
  calib: CalibParams | null = null,
): Record<string, CalcResult> {
  const out: Record<string, CalcResult> = {};
  for (const m of inputs) {
    const r = calcMatch(m.home, m.away, allStats, m.p, calib, m.knockout ?? false);
    if (r) out[m.id] = r;
  }
  return out;
}
