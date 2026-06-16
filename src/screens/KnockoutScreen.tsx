import React, { useMemo, useState } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import type { WmStage } from '../lib/schedule';
import MatchCard from '../components/MatchCard';
import BracketView from '../components/BracketView';
import styles from './KnockoutScreen.module.css';

type Props = {
  matches: MatchEntry[];
  onMatchClick: (m: MatchEntry) => void;
};

const STAGE_ORDER: WmStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
];

const STAGE_LABELS: Record<WmStage, string> = {
  GROUP_STAGE:    'Gruppenphase',
  ROUND_OF_32:   'Runde der letzten 32',
  ROUND_OF_16:   'Achtelfinale',
  QUARTER_FINALS: 'Viertelfinale',
  SEMI_FINALS:   'Halbfinale',
  THIRD_PLACE:   'Spiel um Platz 3',
  FINAL:         'Finale',
};

export default function KnockoutScreen({ matches, onMatchClick }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'bracket'>('list');

  const byStage = useMemo(() => {
    const ko = matches.filter(m => m.stage !== 'GROUP_STAGE');
    const map = new Map<WmStage, MatchEntry[]>();
    for (const m of ko) {
      const list = map.get(m.stage) ?? [];
      list.push(m);
      map.set(m.stage, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    }
    return map;
  }, [matches]);

  const hasAny = STAGE_ORDER.some(s => (byStage.get(s)?.length ?? 0) > 0);

  const bracketMatches = matches.filter(m =>
    m.stage === 'QUARTER_FINALS' ||
    m.stage === 'SEMI_FINALS' ||
    m.stage === 'FINAL' ||
    m.stage === 'THIRD_PLACE',
  );
  const hasBracket = bracketMatches.length > 0;

  return (
    <div className={styles.root}>
      {hasBracket && (
        <div className={styles.viewToggle}>
          <button
            className={`${styles.togglePill}${viewMode === 'list' ? ` ${styles.togglePillActive}` : ''}`}
            onClick={() => setViewMode('list')}
            type="button"
          >
            Liste
          </button>
          <button
            className={`${styles.togglePill}${viewMode === 'bracket' ? ` ${styles.togglePillActive}` : ''}`}
            onClick={() => setViewMode('bracket')}
            type="button"
          >
            Bracket
          </button>
        </div>
      )}

      {viewMode === 'bracket' ? (
        <BracketView matches={bracketMatches} onMatchClick={onMatchClick} />
      ) : (
        <>
          {!hasAny && (
            <div className={styles.empty}>
              <p>Die K.o.-Runde beginnt nach der Gruppenphase.</p>
            </div>
          )}
          {STAGE_ORDER.map(stage => {
            const list = byStage.get(stage);
            if (!list || list.length === 0) return null;
            return (
              <section key={stage} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{STAGE_LABELS[stage]}</h2>
                </div>
                <div className={styles.list}>
                  {list.map((m, i) => <MatchCard key={m.id} match={m} onClick={() => onMatchClick(m)} style={{ '--card-index': i } as React.CSSProperties} />)}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
