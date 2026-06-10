// Poisson-Modell + Dixon-Coles + Draw-Boost
// Vollstaendige Implementierung folgt (aus BLforecast portieren)

export type TeamStats = {
  rank: number;
  hGF: number; hGA: number;
  aGF: number; aGA: number;
};

export type FormData = { gf: number; ga: number } | null;
export type MarketProbs = { h: number; d: number; a: number };
export type Outcome = 'H' | 'D' | 'A';

export type CalcResult = {
  pH: number; pD: number; pA: number;
  naturalTipp: string | null;
  wo: Outcome;
  srt: Array<[string, number]>;
  lH: number; lA: number;
  fp: number;
  drawBlocked: boolean;
  lambdaDiff: number;
  marketApplied: boolean;
  calibrated: boolean;
};

// ---------------------------------------------------------------------------
// Modell-Konstanten
// ---------------------------------------------------------------------------

const DC_RHO         = -0.13;
const FORM_WEIGHT    = 0.40;
const DECAY          = 0.72;
const DRAW_BOOST_MAX = 0;
const DRAW_BOOST_RANGE = 0.40;
const M              = 7;   // max Tore pro Team in der Matrix
const LAMBDA_MIN     = 0.3;
const LAMBDA_MAX     = 4.5;

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
// Draw-Boost: hebt Remis-Wahrscheinlichkeit an, wenn Teams aehnlich stark
// ---------------------------------------------------------------------------

function applyDrawBoost(pH: number, pD: number, pA: number, lH: number, lA: number) {
  const diff = Math.abs(lH - lA);
  if (diff >= DRAW_BOOST_RANGE) return { pH, pD, pA };
  const boost = DRAW_BOOST_MAX * (1 - diff / DRAW_BOOST_RANGE);
  const take = boost / 2;
  return {
    pH: pH - take,
    pD: pD + boost,
    pA: pA - take,
  };
}

// ---------------------------------------------------------------------------
// Effektive Lambdas (neutral ground: Durchschnitt aus Heim/Auswaerts)
// ---------------------------------------------------------------------------

function effectiveLambdas(
  hStats: TeamStats,
  aStats: TeamStats,
  hForm: FormData,
  aForm: FormData,
): { lH: number; lA: number } {
  const hAttBase = (hStats.hGF + hStats.aGF) / 2;
  const hDefBase = (hStats.hGA + hStats.aGA) / 2;
  const aAttBase = (aStats.hGF + aStats.aGF) / 2;
  const aDefBase = (aStats.hGA + aStats.aGA) / 2;

  let hAtt = hAttBase;
  let hDef = hDefBase;
  let aAtt = aAttBase;
  let aDef = aDefBase;

  if (hForm) {
    hAtt = hAtt * (1 - FORM_WEIGHT) + hForm.gf * FORM_WEIGHT * DECAY;
    hDef = hDef * (1 - FORM_WEIGHT) + hForm.ga * FORM_WEIGHT * DECAY;
  }
  if (aForm) {
    aAtt = aAtt * (1 - FORM_WEIGHT) + aForm.gf * FORM_WEIGHT * DECAY;
    aDef = aDef * (1 - FORM_WEIGHT) + aForm.ga * FORM_WEIGHT * DECAY;
  }

  const lH = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, hAtt * aDef));
  const lA = Math.min(LAMBDA_MAX, Math.max(LAMBDA_MIN, aAtt * hDef));
  return { lH, lA };
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Wahrscheinlichkeiten + Matrix aus Lambdas (ohne Form/Boost)
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
  // Return the final matrix directly — caller uses it for rawProbs + topResults
  return { lH: lH_adj, lA: lA_adj, mat: buildMatrix(lH_adj, lA_adj) };
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
  hForm: FormData;
  aForm: FormData;
};

export function calcMatch(
  home: string,
  away: string,
  allStats: Record<string, TeamStats>,
  hForm: FormData = null,
  aForm: FormData = null,
  market: MarketProbs | null = null,
): CalcResult | null {
  const hStats = allStats[home];
  const aStats = allStats[away];
  if (!hStats || !aStats) return null;

  let { lH, lA } = effectiveLambdas(hStats, aStats, hForm, aForm);
  let marketApplied = false;
  let mat: number[][];

  if (market) {
    const corrected = applyMarketCorrection(lH, lA, market);
    lH = corrected.lH;
    lA = corrected.lA;
    mat = corrected.mat; // reuse matrix — no redundant buildMatrix call
    marketApplied = true;
  } else {
    mat = buildMatrix(lH, lA);
  }

  let { pH, pD, pA } = rawProbs(mat);
  const boosted = applyDrawBoost(pH, pD, pA, lH, lA);
  pH = Math.max(0, boosted.pH);
  pD = Math.max(0, boosted.pD);
  pA = Math.max(0, boosted.pA);
  const sum = pH + pD + pA;
  pH /= sum; pD /= sum; pA /= sum;

  const srt = topResults(mat);
  const fp = Math.max(pH, pD, pA);
  const wo: Outcome = pH >= pD && pH >= pA ? 'H' : pD >= pA ? 'D' : 'A';
  const naturalTipp = deriveNaturalTipp(srt, wo);
  const lambdaDiff = lH - lA;

  return {
    pH, pD, pA,
    naturalTipp,
    wo,
    srt,
    lH, lA,
    fp,
    drawBlocked: false,
    lambdaDiff,
    marketApplied,
    calibrated: false,
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
): Record<string, CalcResult> {
  const out: Record<string, CalcResult> = {};
  for (const m of inputs) {
    const r = calcMatch(m.home, m.away, allStats, m.hForm, m.aForm, m.p);
    if (r) out[m.id] = r;
  }
  return out;
}
