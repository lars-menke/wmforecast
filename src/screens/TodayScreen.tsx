import React, { useMemo } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import type { WmStage } from '../lib/schedule';
import MatchCard from '../components/MatchCard';
import styles from './TodayScreen.module.css';

type Props = {
  matches: MatchEntry[];
  onMatchClick: (m: MatchEntry) => void;
};

const STAGE_LABELS: Record<WmStage, string> = {
  GROUP_STAGE:    'Gruppenphase',
  ROUND_OF_32:    'Runde der letzten 32',
  ROUND_OF_16:    'Achtelfinale',
  QUARTER_FINALS: 'Viertelfinale',
  SEMI_FINALS:    'Halbfinale',
  THIRD_PLACE:    'Spiel um Platz 3',
  FINAL:          'Finale',
};

function contextLabel(m: MatchEntry): string {
  return m.stage === 'GROUP_STAGE' ? `Gruppe ${m.group}` : STAGE_LABELS[m.stage];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export default function TodayScreen({ matches, onMatchClick }: Props) {
  const today = useMemo(() => {
    const now = new Date();
    return matches
      .filter(m => isSameDay(new Date(m.kickoff), now))
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }, [matches]);

  const live     = today.filter(m => m.live);
  const upcoming = today.filter(m => !m.live && !m.finished);
  const finished = today.filter(m => !m.live && m.finished);

  const dateLabel = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const sections: Array<{ key: string; label: string; live?: boolean; items: MatchEntry[] }> = [
    { key: 'live',     label: 'Live',    live: true, items: live },
    { key: 'upcoming', label: 'Kommend',             items: upcoming },
    { key: 'finished', label: 'Beendet',             items: finished },
  ];

  let cardIndex = 0;

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <h2 className={styles.date}>{dateLabel}</h2>
        <span className={styles.count}>
          {today.length} {today.length === 1 ? 'Spiel' : 'Spiele'}
        </span>
      </div>

      {today.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Heute keine Spiele</span>
          <span className={styles.emptyHint}>Schau in der Gruppenphase oder K.o.-Runde nach den nächsten Partien.</span>
        </div>
      ) : (
        sections.filter(s => s.items.length > 0).map(s => (
          <section key={s.key} className={styles.section}>
            <div className={styles.sectionHeader}>
              {s.live && <span className={styles.liveDot} aria-hidden="true" />}
              <h3 className={`${styles.sectionLabel}${s.live ? ` ${styles.sectionLabelLive}` : ''}`}>
                {s.label}
              </h3>
            </div>
            {s.items.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={() => onMatchClick(m)}
                context={contextLabel(m)}
                style={{ '--card-index': cardIndex++ } as React.CSSProperties}
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
