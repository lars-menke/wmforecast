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

// Hardcodierte Kalibrierungsparameter (WM 2014 + 2018 + 2022, n=176 Spiele)
export const HARDCODED_CALIB: CalibParams = {
  aH: 0.763, bH: 0.245,
  aD: 0.867, bD: -0.131,
  aA: 0.8,   bA: 0.021,
  n: 176,
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
