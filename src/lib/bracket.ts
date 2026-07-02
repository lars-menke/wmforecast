// Offizieller WM-2026-K.o.-Baum: R32-Setzung nach Gruppenposition + Topologie.
// Die echten Teams werden deterministisch aus den Gruppentabellen in die
// korrekten Slots gesetzt; höhere Runden schreiben die Sieger fort.

import { WM_SCHEDULE, type WmStage, type WmMatch } from './schedule';
import type { GroupStandings } from './fetchGroups';
import type { MatchResult } from './fetchResults';

// Position in einer Gruppe: 1 = Sieger, 2 = Zweiter, 3 = Dritter
type Pos = { rank: 1 | 2 | 3; group: string };

// R32-Setzung (offizielle FIFA-2026-Zuordnung, Matches 73–88)
const R32_TEMPLATE: Record<number, [Pos, Pos]> = {
  73: [{ rank: 2, group: 'A' }, { rank: 2, group: 'B' }],
  74: [{ rank: 1, group: 'E' }, { rank: 3, group: 'D' }],
  75: [{ rank: 1, group: 'F' }, { rank: 2, group: 'C' }],
  76: [{ rank: 1, group: 'C' }, { rank: 2, group: 'F' }],
  77: [{ rank: 1, group: 'I' }, { rank: 3, group: 'F' }],
  78: [{ rank: 2, group: 'E' }, { rank: 2, group: 'I' }],
  79: [{ rank: 1, group: 'A' }, { rank: 3, group: 'E' }],
  80: [{ rank: 1, group: 'L' }, { rank: 3, group: 'K' }],
  81: [{ rank: 1, group: 'D' }, { rank: 3, group: 'B' }],
  82: [{ rank: 1, group: 'G' }, { rank: 3, group: 'I' }],
  83: [{ rank: 2, group: 'K' }, { rank: 2, group: 'L' }],
  84: [{ rank: 1, group: 'H' }, { rank: 2, group: 'J' }],
  85: [{ rank: 1, group: 'B' }, { rank: 3, group: 'J' }],
  86: [{ rank: 1, group: 'J' }, { rank: 2, group: 'H' }],
  87: [{ rank: 1, group: 'K' }, { rank: 3, group: 'L' }],
  88: [{ rank: 2, group: 'D' }, { rank: 2, group: 'G' }],
};

// Baum-Topologie: welche zwei Match-Sieger je Folgespiel aufeinandertreffen
const TREE: Record<number, [number, number]> = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
};
// Spiel um Platz 3 (103): Verlierer der Halbfinals
const THIRD_PLACE = { match: 103, semis: [101, 102] as [number, number] };

// Reihenfolge der Runden im statischen Spielplan (chronologisch = Match-Nummern)
const KO_STAGE_START: Record<WmStage, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_32: 73,
  ROUND_OF_16: 89,
  QUARTER_FINALS: 97,
  SEMI_FINALS: 101,
  THIRD_PLACE: 103,
  FINAL: 104,
};

/** Match-Nummer -> statische Slot-ID (z.B. 74 -> "R32-M2"). */
function buildMatchNumberToSlotId(): Map<number, string> {
  const map = new Map<number, string>();
  const byStage = new Map<WmStage, WmMatch[]>();
  for (const m of WM_SCHEDULE) {
    if (m.stage === 'GROUP_STAGE') continue;
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }
  for (const [stage, arr] of byStage) {
    arr.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    const start = KO_STAGE_START[stage];
    arr.forEach((m, i) => map.set(start + i, m.id));
  }
  return map;
}

function posTeam(pos: Pos, standings: GroupStandings): string | null {
  const rows = standings[pos.group];
  if (!rows || rows.length < pos.rank) return null;
  return rows[pos.rank - 1]?.code ?? null;
}

/** Ergebnis für ein Team-Paar (richtungsunabhängig). */
function lookupResult(
  a: string, b: string,
  resultsMap: Record<string, MatchResult>,
): { finished: boolean; advancer: string | null } {
  const fwd = resultsMap[`${a}-${b}`];
  const rev = resultsMap[`${b}-${a}`];
  const res = fwd ?? rev;
  if (!res?.finished) return { finished: false, advancer: null };
  // advancer 'H'/'A' bezieht sich auf die Heim/Auswärts-Sicht des Ergebnisses
  let advancer: string | null = null;
  if (res.advancer === 'H') advancer = res.homeCode;
  else if (res.advancer === 'A') advancer = res.awayCode;
  return { finished: true, advancer };
}

export type BracketSlotTeams = { home: string | null; away: string | null };

/**
 * Löst alle K.o.-Slots deterministisch auf:
 * - R32 direkt aus der Gruppentabelle (offizielle Setzung)
 * - höhere Runden aus den fortgeschriebenen Siegern
 * Rückgabe: Slot-ID -> Teams (null = noch offen).
 */
export function resolveKnockout(
  standings: GroupStandings,
  resultsMap: Record<string, MatchResult>,
): Map<string, BracketSlotTeams> {
  const slotOf = buildMatchNumberToSlotId();
  const teamsMemo = new Map<number, BracketSlotTeams>();
  const winnerMemo = new Map<number, string | null>();

  function teamsOf(n: number): BracketSlotTeams {
    const cached = teamsMemo.get(n);
    if (cached) return cached;

    let out: BracketSlotTeams;
    if (R32_TEMPLATE[n]) {
      const [a, b] = R32_TEMPLATE[n];
      out = { home: posTeam(a, standings), away: posTeam(b, standings) };
    } else if (n === THIRD_PLACE.match) {
      out = { home: loserOf(THIRD_PLACE.semis[0]), away: loserOf(THIRD_PLACE.semis[1]) };
    } else {
      const [c1, c2] = TREE[n] ?? [0, 0];
      out = { home: winnerOf(c1), away: winnerOf(c2) };
    }
    teamsMemo.set(n, out);
    return out;
  }

  function winnerOf(n: number): string | null {
    if (winnerMemo.has(n)) return winnerMemo.get(n) ?? null;
    winnerMemo.set(n, null); // Zyklenschutz
    const { home, away } = teamsOf(n);
    let w: string | null = null;
    if (home && away) {
      const r = lookupResult(home, away, resultsMap);
      if (r.finished) w = r.advancer; // null bei Remis ohne bekannten Sieger
    }
    winnerMemo.set(n, w);
    return w;
  }

  function loserOf(n: number): string | null {
    const { home, away } = teamsOf(n);
    const w = winnerOf(n);
    if (!home || !away || !w) return null;
    return w === home ? away : home;
  }

  const result = new Map<string, BracketSlotTeams>();
  for (const [num, slotId] of slotOf) {
    result.set(slotId, teamsOf(num));
  }
  return result;
}
