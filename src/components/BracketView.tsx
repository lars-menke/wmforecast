import React from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { WM_SCHEDULE, type WmStage } from '../lib/schedule';
import { NATIONS } from '../lib/nations';
import styles from './BracketView.module.css';

type Props = {
  matches: MatchEntry[];
  onMatchClick: (m: MatchEntry) => void;
};

type BracketSlot = {
  id: string;
  home: string;
  away: string;
  actual: MatchEntry['actual'];
  finished: boolean;
  entry: MatchEntry | null; // real entry for click handling, null = placeholder
};

const BRACKET_ROUNDS: Array<{ stage: WmStage; label: string }> = [
  { stage: 'ROUND_OF_32',    label: 'Letzte 32' },
  { stage: 'ROUND_OF_16',    label: 'Achtelfinale' },
  { stage: 'QUARTER_FINALS', label: 'Viertelfinale' },
  { stage: 'SEMI_FINALS',    label: 'Halbfinale' },
  { stage: 'FINAL',          label: 'Finale' },
];

// Offizielle FIFA-2026-Bracket-Topologie (Match-Nummern):
//   R16-89=(W74,W77)  R16-90=(W73,W75)  R16-91=(W76,W78)  R16-92=(W79,W80)
//   R16-93=(W83,W84)  R16-94=(W81,W82)  R16-95=(W86,W88)  R16-96=(W85,W87)
//   VF97=(89,90) VF98=(93,94) VF99=(91,92) VF100=(95,96)
//   HF101=(97,98) HF102=(99,100)  Finale=(101,102)
//
// FIFA nummeriert die Spiele chronologisch, und resolveSchedule() setzt die
// echten Begegnungen chronologisch in die Slots — daher entspricht Slot-Index k
// dem offiziellen Match (73+k) bzw. (89+k). Durch Umsortierung der R32- und
// R16-Spalten in die planare Baum-Reihenfolge (DFS über den Baum) richten sich
// ALLE Verbindungen R32 → R16 → VF → HF → Finale mit reiner Nachbar-Paarung
// korrekt aus — ohne Gruppentabellen.

// R32 planar: [74,77,73,75, 83,84,81,82, 76,78,79,80, 86,88,85,87] als Indizes (Match-73)
const R32_BRACKET_ORDER = [1, 4, 0, 2, 10, 11, 8, 9, 3, 5, 6, 7, 13, 15, 12, 14];
// R16 planar: [89,90, 93,94, 91,92, 95,96] als Indizes (Match-89)
const R16_BRACKET_ORDER = [0, 1, 4, 5, 2, 3, 6, 7];

const BRACKET_ORDERS: Partial<Record<WmStage, number[]>> = {
  ROUND_OF_32: R32_BRACKET_ORDER,
  ROUND_OF_16: R16_BRACKET_ORDER,
};

function buildSlots(stage: WmStage, byId: Map<string, MatchEntry>): BracketSlot[] {
  const slots = WM_SCHEDULE
    .filter(m => m.stage === stage)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map(m => {
      const entry = byId.get(m.id) ?? null;
      return {
        id: m.id,
        home: entry?.home ?? m.home,
        away: entry?.away ?? m.away,
        actual: entry?.actual ?? null,
        finished: entry?.finished ?? false,
        entry,
      };
    });

  // In planare Baum-Reihenfolge bringen, damit benachbarte Paare korrekt verbinden
  const order = BRACKET_ORDERS[stage];
  if (order && slots.length === order.length) {
    return order.map(i => slots[i]);
  }
  return slots;
}

function BracketMatch({ slot, onClick }: { slot: BracketSlot; onClick: () => void }) {
  const homeNation = NATIONS[slot.home];
  const awayNation = NATIONS[slot.away];
  const isTbd = slot.home === 'TBD' || slot.away === 'TBD' || slot.entry == null;

  const homeWon = slot.actual != null && slot.finished && slot.actual.g1 > slot.actual.g2;
  const awayWon = slot.actual != null && slot.finished && slot.actual.g2 > slot.actual.g1;

  return (
    <button
      className={`${styles.matchBox}${isTbd ? ` ${styles.matchBoxTbd}` : ''}`}
      onClick={onClick}
      type="button"
      disabled={isTbd}
    >
      <div className={`${styles.team}${homeWon ? ` ${styles.teamWon}` : ''}`}>
        <span className={styles.flag}>{slot.home === 'TBD' ? '' : (homeNation?.flag ?? '🏳️')}</span>
        <span className={styles.code}>{slot.home === 'TBD' ? '—' : (homeNation?.shortName ?? slot.home)}</span>
        {slot.actual && (
          <span className={styles.score} data-numeric>
            {slot.finished ? slot.actual.g1 : (slot.actual.g1Live ?? '')}
          </span>
        )}
      </div>
      <div className={`${styles.team}${awayWon ? ` ${styles.teamWon}` : ''}`}>
        <span className={styles.flag}>{slot.away === 'TBD' ? '' : (awayNation?.flag ?? '🏳️')}</span>
        <span className={styles.code}>{slot.away === 'TBD' ? '—' : (awayNation?.shortName ?? slot.away)}</span>
        {slot.actual && (
          <span className={styles.score} data-numeric>
            {slot.finished ? slot.actual.g2 : (slot.actual.g2Live ?? '')}
          </span>
        )}
      </div>
    </button>
  );
}

function ConnectorColumn({ count }: { count: number }) {
  return (
    <div className={styles.connectorCol} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.connectorPair} />
      ))}
    </div>
  );
}

export default function BracketView({ matches, onMatchClick }: Props) {
  const byId = new Map(matches.map(m => [m.id, m]));

  const rounds = BRACKET_ROUNDS.map(r => ({ ...r, slots: buildSlots(r.stage, byId) }));
  const trd = buildSlots('THIRD_PLACE', byId);

  const handleClick = (slot: BracketSlot) => {
    if (slot.entry) onMatchClick(slot.entry);
  };

  return (
    <div className={styles.root}>
      <div className={styles.bracket}>
        {rounds.map((round, ri) => (
          <React.Fragment key={round.stage}>
            <div className={styles.round}>
              <div className={styles.roundLabel}><span>{round.label}</span></div>
              <div className={styles.roundBody}>
                {round.slots.map(slot => (
                  <div key={slot.id} className={styles.slotWrap}>
                    <BracketMatch slot={slot} onClick={() => handleClick(slot)} />
                  </div>
                ))}
              </div>
            </div>
            {ri < rounds.length - 1 && (
              <ConnectorColumn count={rounds[ri + 1].slots.length} />
            )}
          </React.Fragment>
        ))}
      </div>

      {trd.length > 0 && (
        <div className={styles.thirdSection}>
          <div className={styles.thirdLabel}>Spiel um Platz 3</div>
          <BracketMatch slot={trd[0]} onClick={() => handleClick(trd[0])} />
        </div>
      )}
    </div>
  );
}
