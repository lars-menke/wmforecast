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

function buildSlots(stage: WmStage, byId: Map<string, MatchEntry>): BracketSlot[] {
  return WM_SCHEDULE
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
    <div className={styles.connectorCol}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.connectorPair}>
          <div className={styles.connectorTop} />
          <div className={styles.connectorBottom} />
        </div>
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
              <div className={styles.roundLabel}>{round.label}</div>
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
