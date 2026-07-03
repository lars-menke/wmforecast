import { describe, it, expect } from 'vitest';
import { simulateWithUncertainty } from './simulation';
import { getModelMode, setModelMode } from './modelConfig';

// Kleine, schnelle Simulationsläufe — es geht um Korrektheit der Modi,
// nicht um statistische Präzision.
const DRAWS = 4;
const SIMS = 60;

function run(mode: 'unified' | 'classic') {
  return simulateWithUncertainty({}, DRAWS, SIMS, 0.08, 42, {}, mode);
}

describe('modelConfig', () => {
  it('Default ist unified (v3), auch ohne localStorage', () => {
    expect(getModelMode()).toBe('unified');
  });

  it('setModelMode wirft ohne localStorage nicht', () => {
    expect(() => setModelMode('classic')).not.toThrow();
    expect(() => setModelMode('unified')).not.toThrow();
  });
});

describe('simulateWithUncertainty — Modell-Modi', () => {
  it('liefert in beiden Modi normierte Titelwahrscheinlichkeiten', () => {
    for (const mode of ['unified', 'classic'] as const) {
      const r = run(mode);
      const sum = Object.values(r.title).reduce((s, b) => s + b.median, 0);
      // Median-Summe schwankt leicht um 1 (Perzentile pro Team unabhängig)
      expect(sum).toBeGreaterThan(0.7);
      expect(sum).toBeLessThan(1.3);
      expect(r.nTournaments).toBe(DRAWS * SIMS);
    }
  });

  it('unified und classic produzieren unterschiedliche Titelchancen', () => {
    const u = run('unified');
    const c = run('classic');
    // Gleicher Seed: Abweichungen können nur aus dem Modell-Modus stammen.
    const teams = Object.keys(u.title);
    const maxDiff = Math.max(...teams.map(t =>
      Math.abs((u.title[t]?.median ?? 0) - (c.title[t]?.median ?? 0)),
    ));
    expect(maxDiff).toBeGreaterThan(0);
  });

  it('ist bei gleichem Seed und Modus deterministisch', () => {
    const a = run('unified');
    const b = run('unified');
    for (const t of Object.keys(a.title)) {
      expect(a.title[t].median).toBe(b.title[t].median);
    }
  });
});
