import { describe, it, expect } from 'vitest';
import { resolveKnockout } from './bracket';
import type { GroupStandings, StandingRow } from './fetchGroups';
import type { MatchResult } from './fetchResults';

// ---------------------------------------------------------------------------
// Synthetische Turnierdaten: 12 Gruppen (A-L) mit je 4 Teams "X1".."X4",
// Gruppenposition = Suffix (X1 = Sieger, X2 = Zweiter, X3 = Dritter).
// ---------------------------------------------------------------------------

const GROUPS = 'ABCDEFGHIJKL'.split('');

function row(code: string): StandingRow {
  return { code, played: 3, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
}

function fullStandings(): GroupStandings {
  const s: GroupStandings = {};
  for (const g of GROUPS) {
    s[g] = [row(`${g}1`), row(`${g}2`), row(`${g}3`), row(`${g}4`)];
  }
  return s;
}

// Deterministische Ergebnisse: das lexikografisch kleinere Team gewinnt 1:0.
function playAll(pairs: Array<[string, string]>): Record<string, MatchResult> {
  const results: Record<string, MatchResult> = {};
  for (const [home, away] of pairs) {
    const homeWins = home < away;
    results[`${home}-${away}`] = {
      homeCode: home, awayCode: away,
      g1: homeWins ? 1 : 0, g2: homeWins ? 0 : 1,
      finished: true, live: false,
      advancer: homeWins ? 'H' : 'A',
    };
  }
  return results;
}

function slotTeams(map: ReturnType<typeof resolveKnockout>, id: string): [string | null, string | null] {
  const t = map.get(id);
  return [t?.home ?? null, t?.away ?? null];
}

describe('resolveKnockout — R32-Setzung aus Gruppentabellen', () => {
  it('lässt alle Slots offen, wenn keine Tabellen vorliegen', () => {
    const map = resolveKnockout({}, {});
    for (const [, t] of map) {
      expect(t.home).toBeNull();
      expect(t.away).toBeNull();
    }
  });

  it('besetzt alle 16 R32-Slots gemäß offizieller Vorlage', () => {
    const map = resolveKnockout(fullStandings(), {});
    // Stichproben gegen die offizielle Setzung (M73=2A-2B ... M88=2D-2G)
    expect(slotTeams(map, 'R32-M1')).toEqual(['A2', 'B2']);   // M73
    expect(slotTeams(map, 'R32-M2')).toEqual(['E1', 'D3']);   // M74
    expect(slotTeams(map, 'R32-M3')).toEqual(['F1', 'C2']);   // M75
    expect(slotTeams(map, 'R32-M16')).toEqual(['D2', 'G2']);  // M88

    // Vollständigkeit: 32 eindeutige Teams über alle R32-Slots
    const teams = new Set<string>();
    for (let i = 1; i <= 16; i++) {
      const [h, a] = slotTeams(map, `R32-M${i}`);
      expect(h).not.toBeNull();
      expect(a).not.toBeNull();
      teams.add(h!); teams.add(a!);
    }
    expect(teams.size).toBe(32);
  });

  it('lässt höhere Runden offen, solange keine Ergebnisse vorliegen', () => {
    const map = resolveKnockout(fullStandings(), {});
    expect(slotTeams(map, 'R16-M1')).toEqual([null, null]);
    expect(slotTeams(map, 'FINAL')).toEqual([null, null]);
  });
});

describe('resolveKnockout — Sieger-Fortschreibung', () => {
  it('schreibt R32-Sieger topologisch korrekt ins Achtelfinale fort', () => {
    const standings = fullStandings();
    const base = resolveKnockout(standings, {});
    const r32Pairs: Array<[string, string]> = [];
    for (let i = 1; i <= 16; i++) {
      const [h, a] = slotTeams(base, `R32-M${i}`);
      r32Pairs.push([h!, a!]);
    }
    const map = resolveKnockout(standings, playAll(r32Pairs));

    // R16-M1 = Match 89 = Sieger M74 vs Sieger M77 (offizielle Topologie).
    // M74 = E1 vs D3 -> D3 gewinnt (lexikografisch), M77 = I1 vs F3 -> F3.
    expect(slotTeams(map, 'R16-M1')).toEqual(['D3', 'F3']);
    // R16-M2 = Match 90 = Sieger M73 (A2 vs B2 -> A2) vs Sieger M75 (F1 vs C2 -> C2)
    expect(slotTeams(map, 'R16-M2')).toEqual(['A2', 'C2']);
  });

  it('spielt ein komplettes Turnier bis zu eindeutigem Champion durch', () => {
    const standings = fullStandings();
    let results: Record<string, MatchResult> = {};
    // Runde für Runde: auflösen, alle entscheidbaren Paarungen spielen, wiederholen
    for (let round = 0; round < 6; round++) {
      const map = resolveKnockout(standings, results);
      const pairs: Array<[string, string]> = [];
      for (const [, t] of map) {
        if (t.home && t.away && !results[`${t.home}-${t.away}`]) {
          pairs.push([t.home, t.away]);
        }
      }
      results = { ...results, ...playAll(pairs) };
    }
    const final = resolveKnockout(standings, results);
    const [f1, f2] = slotTeams(final, 'FINAL');
    expect(f1).not.toBeNull();
    expect(f2).not.toBeNull();
    // Platz 3 = Verlierer der Halbfinals, beide gesetzt
    const [t1, t2] = slotTeams(final, '3RD');
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
    // Finalisten und Platz-3-Teilnehmer sind vier verschiedene Teams
    expect(new Set([f1, f2, t1, t2]).size).toBe(4);
  });

  it('nutzt das advancer-Flag bei Elfmeterschießen (Remis nach 120 Min)', () => {
    const standings = fullStandings();
    const base = resolveKnockout(standings, {});
    const [h1, a1] = slotTeams(base, 'R32-M1');
    // M73 endet 1:1, Auswärtsteam kommt per Elfmeterschießen weiter
    const results: Record<string, MatchResult> = {
      [`${h1}-${a1}`]: {
        homeCode: h1!, awayCode: a1!,
        g1: 1, g2: 1, finished: true, live: false, advancer: 'A',
      },
    };
    const map = resolveKnockout(standings, results);
    // Sieger M73 landet als Heimteam von R16-M2 (Match 90)
    const [r16h] = slotTeams(map, 'R16-M2');
    expect(r16h).toBe(a1);
  });

  it('lässt den Folgeslot offen, wenn ein K.o.-Remis keinen advancer hat', () => {
    const standings = fullStandings();
    const base = resolveKnockout(standings, {});
    const [h1, a1] = slotTeams(base, 'R32-M1');
    const results: Record<string, MatchResult> = {
      [`${h1}-${a1}`]: {
        homeCode: h1!, awayCode: a1!,
        g1: 1, g2: 1, finished: true, live: false, // kein advancer
      },
    };
    const map = resolveKnockout(standings, results);
    const [r16h] = slotTeams(map, 'R16-M2');
    expect(r16h).toBeNull();
  });
});
