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

const MATCHDAY_GAP_MS = 10 * 60 * 60 * 1000; // 10h: Lücke zwischen zwei Spieltagen

type Matchday = {
  index: number;
  matches: MatchEntry[];
  labelDate: Date; // erster Kick-off des Spieltags (lokale Zeit) als Anzeigedatum
};

function buildMatchdays(matches: MatchEntry[]): Matchday[] {
  const sorted = [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const days: Matchday[] = [];
  for (const m of sorted) {
    const t = new Date(m.kickoff).getTime();
    const last = days[days.length - 1];
    const prevT = last ? new Date(last.matches[last.matches.length - 1].kickoff).getTime() : -Infinity;
    if (!last || t - prevT > MATCHDAY_GAP_MS) {
      days.push({ index: days.length, matches: [m], labelDate: new Date(m.kickoff) });
    } else {
      last.matches.push(m);
    }
  }
  return days;
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
  const matchdays = useMemo(() => buildMatchdays(matches), [matches]);

  // Active matchday: prefer one with live matches, else nearest upcoming, else last
  const activeIndex = useMemo(() => {
    const now = Date.now();
    // 1. Any live match
    const liveIdx = matchdays.findIndex(d => d.matches.some(m => m.live));
    if (liveIdx >= 0) return liveIdx;
    // 2. First matchday with a future match
    const upcomingIdx = matchdays.findIndex(d =>
      d.matches.some(m => !m.finished && new Date(m.kickoff).getTime() > now)
    );
    if (upcomingIdx >= 0) return upcomingIdx;
    // 3. Last matchday
    return matchdays.length - 1;
  }, [matchdays]);

  const [offset, setOffset] = useState(0);

  // Resolve offset relative to active index, clamped to valid range
  const targetIndex = useMemo(() => {
    return Math.max(0, Math.min(matchdays.length - 1, activeIndex + offset));
  }, [activeIndex, offset, matchdays.length]);

  const targetMatchday = matchdays[targetIndex];
  const dayMatches = targetMatchday?.matches ?? [];

  const live     = dayMatches.filter(m => m.live);
  const upcoming = dayMatches.filter(m => !m.live && !m.finished);
  const finished = dayMatches.filter(m => !m.live && m.finished);

  const canPrev = targetIndex > 0;
  const canNext = targetIndex < matchdays.length - 1;
  const goBack  = useCallback(() => setOffset(o => o - 1), []);
  const goFwd   = useCallback(() => setOffset(o => o + 1), []);

  const isToday = targetIndex === activeIndex && offset === 0;

  const dateLabel = targetMatchday
    ? targetMatchday.labelDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  const dateLabelShort = targetMatchday
    ? targetMatchday.labelDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

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
