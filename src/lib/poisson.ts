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
  goalRuleApplied: boolean;
  favScoreRuleApplied: boolean;
  lambdaDiff: number;
  effectiveDrawThreshold: number;
  marketApplied: boolean;
  calibrated: boolean;
};

// ---------------------------------------------------------------------------
// Modell-Konstanten
// ---------------------------------------------------------------------------

const DC_RHO         = -0.13;
const FORM_WEIGHT    = 0.40;
const DECAY          = 0.72;
const DRAW_BOOST_MAX = 0.15;
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
): CalcResult | null {
  const hStats = allStats[home];
  const aStats = allStats[away];
  if (!hStats || !aStats) return null;

  const { lH, lA } = effectiveLambdas(hStats, aStats, hForm, aForm);
  const mat = buildMatrix(lH, lA);
  let { pH, pD, pA } = rawProbs(mat);
  const boosted = applyDrawBoost(pH, pD, pA, lH, lA);
  pH = Math.max(0, boosted.pH);
  pD = Math.max(0, boosted.pD);
  pA = Math.max(0, boosted.pA);
  const sum = pH + pD + pA;
  pH /= sum; pD /= sum; pA /= sum;

  const srt = topResults(mat);
  const naturalTipp = srt[0][0];
  const fp = Math.max(pH, pD, pA);
  const wo: Outcome = pH >= pD && pH >= pA ? 'H' : pD >= pA ? 'D' : 'A';
  const lambdaDiff = lH - lA;

  return {
    pH, pD, pA,
    naturalTipp,
    wo,
    srt,
    lH, lA,
    fp,
    drawBlocked: false,
    goalRuleApplied: false,
    favScoreRuleApplied: false,
    lambdaDiff,
    effectiveDrawThreshold: 0,
    marketApplied: false,
    calibrated: false,
  };
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
    const r = calcMatch(m.home, m.away, allStats, m.hForm, m.aForm);
    if (r) out[m.id] = r;
  }
  return out;
}
