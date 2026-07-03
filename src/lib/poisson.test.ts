import { describe, it, expect } from 'vitest';
import { calcMatch, probsFromLambda, type TeamStats } from './poisson';

// Zwei exakt gleich starke Teams mit niedrigen Lambdas -> Remis ist der
// wahrscheinlichste Einzelausgang (P(0:0) hoch, Dixon-Coles verstärkt).
const DRAWISH: Record<string, TeamStats> = {
  AAA: { rank: 1, hGF: 0.75, hGA: 0.75, aGF: 0.75, aGA: 0.75 },
  BBB: { rank: 2, hGF: 0.75, hGA: 0.75, aGF: 0.75, aGA: 0.75 },
};

// Klarer Favorit gegen Außenseiter
const LOPSIDED: Record<string, TeamStats> = {
  FAV: { rank: 1, hGF: 2.8, hGA: 0.5, aGF: 2.8, aGA: 0.5 },
  DOG: { rank: 2, hGF: 0.7, hGA: 1.6, aGF: 0.7, aGA: 1.6 },
};

describe('calcMatch — K.o.-Tipplogik', () => {
  it('tippt im Gruppenmodus Remis, wenn Remis am wahrscheinlichsten ist', () => {
    const r = calcMatch('AAA', 'BBB', DRAWISH, null, null, false);
    expect(r).not.toBeNull();
    expect(r!.pD).toBeGreaterThan(r!.pH);
    expect(r!.wo).toBe('D');
    expect(r!.knockout).toBe(false);
  });

  it('tippt im K.o.-Modus nie Remis, auch bei identischen Teams', () => {
    const r = calcMatch('AAA', 'BBB', DRAWISH, null, null, true);
    expect(r).not.toBeNull();
    expect(r!.wo).not.toBe('D');
    expect(['H', 'A']).toContain(r!.wo);
    expect(r!.knockout).toBe(true);
  });

  it('setzt K.o.-Konfidenz auf Weiterkommen inkl. Elfmeterschießen (50/50 bei Remis)', () => {
    const r = calcMatch('FAV', 'DOG', LOPSIDED, null, null, true);
    expect(r).not.toBeNull();
    const expectedFp = Math.max(r!.pH, r!.pA) + r!.pD / 2;
    expect(r!.fp).toBeCloseTo(expectedFp, 10);
    expect(r!.wo).toBe('H');
  });

  it('liefert im K.o.-Modus einen entscheidenden naturalTipp (kein X:X)', () => {
    const r = calcMatch('AAA', 'BBB', DRAWISH, null, null, true);
    expect(r?.naturalTipp).toBeTruthy();
    const [g1, g2] = r!.naturalTipp!.split(':').map(Number);
    expect(g1).not.toBe(g2);
  });

  it('trägt die reine Modellsicht getrennt vom Blend (Marktkorrektur ändert pH, nicht pH_model)', () => {
    const noMarket = calcMatch('FAV', 'DOG', LOPSIDED, null, null, false)!;
    // Markt widerspricht dem Modell deutlich (Außenseiter vorn)
    const withMarket = calcMatch('FAV', 'DOG', LOPSIDED, { h: 25, d: 25, a: 50 }, null, false)!;
    expect(withMarket.marketApplied).toBe(true);
    expect(withMarket.pH_model).toBeCloseTo(noMarket.pH_model, 10);
    expect(withMarket.pH).toBeLessThan(noMarket.pH);
  });
});

describe('probsFromLambda', () => {
  it('normiert auf Summe 1', () => {
    const { pH, pD, pA } = probsFromLambda(1.3, 1.1);
    expect(pH + pD + pA).toBeCloseTo(1, 10);
  });

  it('höheres Lambda -> höhere Siegwahrscheinlichkeit', () => {
    const a = probsFromLambda(2.0, 0.8);
    const b = probsFromLambda(0.8, 2.0);
    expect(a.pH).toBeGreaterThan(a.pA);
    expect(b.pA).toBeGreaterThan(b.pH);
    expect(a.pH).toBeCloseTo(b.pA, 10); // symmetrisch
  });
});
