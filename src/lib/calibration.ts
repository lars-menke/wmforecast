// Platt-Scaling Kalibrierung
// Vorberechnete Parameter aus WM 2018 + WM 2022 Daten

export type CalibParams = {
  aH: number; bH: number;
  aD: number; bD: number;
  aA: number; bA: number;
  n: number;
};

export type CalibSample = {
  pH: number; pD: number; pA: number;
  actual: 'H' | 'D' | 'A';
};

// Hardcodierte Kalibrierungsparameter
// Auto-generiert von scripts/train-from-statsbomb.mjs
// Trainiert auf WM 2018 + WM 2022 Gruppenspiele (StatsBomb open data, n=96)
export const HARDCODED_CALIB: CalibParams = {
  aH: 1.024, bH: -0.086,
  aD: 0.975, bD: 0.010,
  aA: 0.998, bA: 0.062,
  n: 96,
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logit(p: number): number {
  const c = Math.max(0.001, Math.min(0.999, p));
  return Math.log(c / (1 - c));
}

export function applyCalib(
  pH: number, pD: number, pA: number,
  params: CalibParams,
): { pH: number; pD: number; pA: number } {
  const cH = sigmoid(params.aH * logit(pH) + params.bH);
  const cD = sigmoid(params.aD * logit(pD) + params.bD);
  const cA = sigmoid(params.aA * logit(pA) + params.bA);
  const sum = cH + cD + cA;
  return { pH: cH / sum, pD: cD / sum, pA: cA / sum };
}

export function shrinkToMean(pH: number, pD: number, pA: number) {
  const s = 0.88;
  const prior = 1 / 3;
  return {
    pH: s * pH + (1 - s) * prior,
    pD: s * pD + (1 - s) * prior,
    pA: s * pA + (1 - s) * prior,
  };
}

// ---------------------------------------------------------------------------
// Live-Kalibrierung: HARDCODED_CALIB als Prior, Update auf echten Ergebnissen.
//
// Ansatz: gewichtetes Interpolieren der Sigmoid-Parameter zwischen Prior und
// einem simplen Log-Loss-Gradienten-Update über alle Turnierspiele.
// n_prior = Gewicht des Prior in "virtuellen Spielen" (konservativ: 176).
// n_live  = Anzahl tatsächlich gespielter Spiele.
// Der Prior dominiert solange n_live << n_prior.
// ---------------------------------------------------------------------------

export function updateCalib(
  prior: CalibParams,
  samples: CalibSample[],
): CalibParams {
  if (samples.length === 0) return prior;

  // Gradient-Descent auf Log-Loss, 40 Iterationen, lr = 0.05
  // Initialisierung aus Prior-Parametern
  let { aH, bH, aD, bD, aA, bA } = prior;
  const lr = 0.05;
  const iters = 40;

  for (let it = 0; it < iters; it++) {
    let gaH = 0, gbH = 0, gaD = 0, gbD = 0, gaA = 0, gbA = 0;

    for (const s of samples) {
      const lH = logit(s.pH), lD = logit(s.pD), lA = logit(s.pA);
      const cH = sigmoid(aH * lH + bH);
      const cD = sigmoid(aD * lD + bD);
      const cA = sigmoid(aA * lA + bA);
      const sum = cH + cD + cA;
      const pH = cH / sum, pD = cD / sum, pA = cA / sum;

      // Kreuzentropie-Gradient für jede Klasse (vereinfacht, direkt auf sigmoid-Output)
      const dH = pH - (s.actual === 'H' ? 1 : 0);
      const dD = pD - (s.actual === 'D' ? 1 : 0);
      const dA = pA - (s.actual === 'A' ? 1 : 0);

      gaH += dH * cH * (1 - cH) * lH;
      gbH += dH * cH * (1 - cH);
      gaD += dD * cD * (1 - cD) * lD;
      gbD += dD * cD * (1 - cD);
      gaA += dA * cA * (1 - cA) * lA;
      gbA += dA * cA * (1 - cA);
    }

    const n = samples.length;
    // L2-Regularisierung: zieht Parameter zum Prior zurück
    // Stärke = n / n_prior — schwach wenn wenig Live-Daten
    const regW = n / prior.n;
    aH -= lr * (gaH / n + regW * (aH - prior.aH));
    bH -= lr * (gbH / n + regW * (bH - prior.bH));
    aD -= lr * (gaD / n + regW * (aD - prior.aD));
    bD -= lr * (gbD / n + regW * (bD - prior.bD));
    aA -= lr * (gaA / n + regW * (aA - prior.aA));
    bA -= lr * (gbA / n + regW * (bA - prior.bA));
  }

  return { aH, bH, aD, bD, aA, bA, n: prior.n + samples.length };
}
