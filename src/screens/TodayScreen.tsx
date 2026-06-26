import React, { useMemo, useState, useCallback } from 'react';
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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Spieltag-Grenze bei 03:00 Uhr lokaler Zeit — Spiele nach Mitternacht gehören noch zum Vorabend
function startOfMatchday(d: Date): Date {
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

const MAX_OFFSET = 3;

export default function TodayScreen({ matches, onMatchClick }: Props) {
  const [offset, setOffset] = useState(0);

  // All matchdays (shifted boundary at 03:00 local — late-night games belong to the previous evening)
  const matchDays = useMemo(() => {
    const seen = new Set<string>();
    const days: Date[] = [];
    for (const m of matches) {
      const d = startOfMatchday(new Date(m.kickoff));
      const key = d.toISOString().slice(0, 10);
      if (!seen.has(key)) { seen.add(key); days.push(d); }
    }
    days.sort((a, b) => a.getTime() - b.getTime());
    return days;
  }, [matches]);

  const today = useMemo(() => startOfMatchday(new Date()), []);

  // Resolved target matchday: today + offset, clamped to existing matchdays
  const targetDay = useMemo(() => {
    const desired = startOfDay(addDays(today, offset));
    return matchDays.find(d => isSameDay(d, desired)) ?? desired;
  }, [today, offset, matchDays]);

  const dayMatches = useMemo(() => {
    return matches
      .filter(m => isSameDay(startOfMatchday(new Date(m.kickoff)), targetDay))
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }, [matches, targetDay]);

  const live     = dayMatches.filter(m => m.live);
  const upcoming = dayMatches.filter(m => !m.live && !m.finished);
  const finished = dayMatches.filter(m => !m.live && m.finished);

  // Navigation: can go back/forward if there are match days in that direction
  const earliestDay = matchDays[0];
  const latestDay   = matchDays[matchDays.length - 1];
  const canPrev = earliestDay && targetDay > earliestDay && offset > -MAX_OFFSET;
  const canNext = latestDay  && targetDay < latestDay   && offset < MAX_OFFSET;

  const goBack = useCallback(() => setOffset(o => o - 1), []);
  const goFwd  = useCallback(() => setOffset(o => o + 1), []);

  const isToday = isSameDay(targetDay, today);

  // Display label: use the matchday key date itself (= the main evening date of the block)
  // For blocks that extend past midnight, targetDay already points to the "evening" date
  const displayDate = new Date(targetDay.getTime() + 12 * 60 * 60 * 1000); // noon of that day
  const dateLabel = displayDate.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const dateLabelShort = displayDate.toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const sections: Array<{ key: string; label: string; live?: boolean; items: MatchEntry[] }> = [
    { key: 'live',     label: 'Live',    live: true, items: live },
    { key: 'upcoming', label: 'Kommend',             items: upcoming },
    { key: 'finished', label: 'Beendet',             items: finished },
  ];

  let cardIndex = 0;

  return (
    <div className={styles.root}>
      {/* Day navigator */}
      <div className={styles.nav}>
        <button
          className={styles.navArrow}
          onClick={goBack}
          disabled={!canPrev}
          type="button"
          aria-label="Vorheriger Spieltag"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
            <path d="M8 1L1.5 7.5L8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className={styles.navCenter}>
          <span className={styles.navDate}>{dateLabelShort}</span>
          {isToday && <span className={styles.navToday}>Heute</span>}
        </div>

        <button
          className={styles.navArrow}
          onClick={goFwd}
          disabled={!canNext}
          type="button"
          aria-label="Nächster Spieltag"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
            <path d="M1 1L7.5 7.5L1 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className={styles.scroll}>
        <div className={styles.head}>
          <h2 className={styles.date}>{dateLabel}</h2>
          <span className={styles.count}>
            {dayMatches.length} {dayMatches.length === 1 ? 'Spiel' : 'Spiele'}
          </span>
        </div>

        {dayMatches.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>Keine Spiele an diesem Tag</span>
            <span className={styles.emptyHint}>Navigiere zu einem anderen Spieltag.</span>
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
    </div>
  );
}
