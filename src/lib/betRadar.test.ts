import { describe, it, expect } from 'vitest';
import { computeValueBets, evOf, kellyStake, MIN_EV } from './betRadar';
import type { MatchEntry } from './useMatches';
import type { RawOdds } from './fetchOdds';
import type { CalcResult } from './poisson';

function mkResult(pH: number, pD: number, pA: number, knockout = false): CalcResult {
  return {
    pH, pD, pA,
    pH_model: pH, pD_model: pD, pA_model: pA,
    market: null,
    naturalTipp: '1:0', wo: pH >= pA ? 'H' : 'A', srt: [],
    lH: 1.2, lA: 1.0, lH_model: 1.2, lA_model: 1.0,
    fp: Math.max(pH, pD, pA), drawBlocked: false, lambdaDiff: 0.2,
    marketApplied: false, calibrated: false, knockout,
  };
}

function mkMatch(id: string, home: string, away: string, result: CalcResult, opts: Partial<MatchEntry> = {}): MatchEntry {
  return {
    id, apiId: 0, group: 'A', stage: result.knockout ? 'ROUND_OF_16' : 'GROUP_STAGE',
    home, away,
    kickoff: new Date(Date.now() + 3600_000).toISOString(), // in 1h
    result, actual: null, finished: false, live: false, goals: [], espnId: undefined,
    ...opts,
  };
}

describe('evOf / kellyStake', () => {
  it('EV = p*odds - 1', () => {
    expect(evOf(0.5, 2.4)).toBeCloseTo(0.2, 10);
    expect(evOf(0.4, 2.5)).toBeCloseTo(0, 10);
  });

  it('Kelly ist 0 ohne Edge und gedeckelt bei 10%', () => {
    expect(kellyStake(0.4, 2.5)).toBe(0);            // EV = 0
    expect(kellyStake(0.9, 5.0)).toBe(0.1);          // riesiger Edge -> Deckel
    const f = kellyStake(0.5, 2.4);                  // EV +20%, quarter-Kelly
    expect(f).toBeCloseTo(0.25 * 0.2 / 1.4, 10);
  });
});

describe('computeValueBets', () => {
  const odds: Record<string, RawOdds> = {
    'AAA-BBB': { h: 2.6, d: 3.4, a: 3.0 },
  };

  it('findet Value nur oberhalb der Schwelle', () => {
    // pH=0.5 @2.6 -> EV +30% (Value); pD=0.2 @3.4 -> -32%; pA=0.3 @3.0 -> -10%
    const m = mkMatch('m1', 'AAA', 'BBB', mkResult(0.5, 0.2, 0.3));
    const bets = computeValueBets([m], odds);
    expect(bets).toHaveLength(1);
    expect(bets[0].side).toBe('H');
    expect(bets[0].ev).toBeCloseTo(0.3, 10);
    expect(bets[0].odds).toBe(2.6);
  });

  it('überspringt gestartete, laufende und beendete Spiele', () => {
    const started = mkMatch('m1', 'AAA', 'BBB', mkResult(0.5, 0.2, 0.3), {
      kickoff: new Date(Date.now() - 1000).toISOString(),
    });
    const liveM = mkMatch('m2', 'AAA', 'BBB', mkResult(0.5, 0.2, 0.3), { live: true });
    const doneM = mkMatch('m3', 'AAA', 'BBB', mkResult(0.5, 0.2, 0.3), { finished: true });
    expect(computeValueBets([started, liveM, doneM], odds)).toHaveLength(0);
  });

  it('nutzt gedrehte Quoten, wenn nur AWAY-HOME vorliegt', () => {
    const revOdds: Record<string, RawOdds> = { 'BBB-AAA': { h: 3.0, d: 3.4, a: 2.6 } };
    const m = mkMatch('m1', 'AAA', 'BBB', mkResult(0.5, 0.2, 0.3));
    const bets = computeValueBets([m], revOdds);
    expect(bets).toHaveLength(1);
    expect(bets[0].side).toBe('H');
    expect(bets[0].odds).toBe(2.6); // a-Quote der gedrehten Notierung
  });

  it('bietet bei K.o.-Spielen kein Remis an', () => {
    // Remis hätte massiven Value (pD=0.5 @3.4 -> +70%), ist aber K.o.
    const m = mkMatch('m1', 'AAA', 'BBB', mkResult(0.25, 0.5, 0.25, true));
    const bets = computeValueBets([m], odds);
    expect(bets.every(b => b.side !== 'D')).toBe(true);
  });

  it('sortiert nach EV absteigend und respektiert MIN_EV-Default', () => {
    const m1 = mkMatch('m1', 'AAA', 'BBB', mkResult(0.45, 0.25, 0.30)); // H: EV +17%
    const m2 = mkMatch('m2', 'AAA', 'BBB', mkResult(0.60, 0.20, 0.20)); // H: EV +56%
    const bets = computeValueBets([m1, m2], odds);
    expect(bets[0].ev).toBeGreaterThan(bets[1].ev);
    expect(bets.every(b => b.ev > MIN_EV)).toBe(true);
  });
});
