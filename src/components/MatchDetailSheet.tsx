import { useEffect, useRef, useState } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { NATIONS } from '../lib/nations';
import TeamLogo from './TeamLogo';
import ProbabilityBar from './ProbabilityBar';
import styles from './MatchDetailSheet.module.css';

type Props = {
  match: MatchEntry | null;
  onClose: () => void;
};

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

export default function MatchDetailSheet({ match, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Einblenden wenn match sich aendert
  useEffect(() => {
    if (match) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [match]);

  // Schliessen per Hintergrund-Klick
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  // Touch-Swipe nach unten schliesst Sheet
  const touchStartY = useRef(0);
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 60) handleClose();
  }

  if (!match) return null;

  const { home, away, result, actual, finished, kickoff } = match;
  const homeNation = NATIONS[home];
  const awayNation = NATIONS[away];
  const { pH, pD, pA, lH, lA, naturalTipp, srt, lambdaDiff, marketApplied, calibrated, drawBlocked } = result;
  const top5 = srt.slice(0, 5);

  return (
    <div
      className={`${styles.backdrop}${visible ? ` ${styles.backdropVisible}` : ''}`}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${homeNation?.name ?? home} gegen ${awayNation?.name ?? away}`}
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet}${visible ? ` ${styles.sheetVisible}` : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag-Handle */}
        <div className={styles.handle} />

        {/* Teams */}
        <div className={styles.teams}>
          <div className={styles.teamCol}>
            <TeamLogo code={home} size={48} />
            <span className={styles.teamName}>{homeNation?.name ?? home}</span>
          </div>
          <div className={styles.vsBox}>
            {finished && actual ? (
              <span className={styles.result} data-numeric>{actual.g1}:{actual.g2}</span>
            ) : (
              <span className={styles.vs}>vs</span>
            )}
            <span className={styles.date}>{formatKickoff(kickoff)}</span>
          </div>
          <div className={`${styles.teamCol} ${styles.teamColRight}`}>
            <TeamLogo code={away} size={48} />
            <span className={styles.teamName}>{awayNation?.name ?? away}</span>
          </div>
        </div>

        {/* Wahrscheinlichkeiten */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Prognose</h3>
          <ProbabilityBar home={pH} draw={pD} away={pA} />
          <div className={styles.probRow}>
            <div className={styles.probCell}>
              <span className={styles.probVal} data-numeric>{pct(pH)}</span>
              <span className={styles.probLabel}>Sieg {homeNation?.shortName ?? home}</span>
            </div>
            <div className={styles.probCell}>
              <span className={styles.probVal} data-numeric>{pct(pD)}</span>
              <span className={styles.probLabel}>Remis</span>
            </div>
            <div className={styles.probCell}>
              <span className={styles.probVal} data-numeric>{pct(pA)}</span>
              <span className={styles.probLabel}>Sieg {awayNation?.shortName ?? away}</span>
            </div>
          </div>
        </section>

        {/* Modell-Details */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Modell</h3>
          <div className={styles.detailGrid}>
            <span className={styles.detailKey}>xG {homeNation?.shortName ?? home}</span>
            <span className={styles.detailVal} data-numeric>{lH.toFixed(2)}</span>
            <span className={styles.detailKey}>xG {awayNation?.shortName ?? away}</span>
            <span className={styles.detailVal} data-numeric>{lA.toFixed(2)}</span>
            <span className={styles.detailKey}>Lambda-Differenz</span>
            <span className={styles.detailVal} data-numeric>{lambdaDiff >= 0 ? '+' : ''}{lambdaDiff.toFixed(2)}</span>
            <span className={styles.detailKey}>Wahrscheinlichstes Ergebnis</span>
            <span className={styles.detailVal} data-numeric>{naturalTipp ?? '-'}</span>
            <span className={styles.detailKey}>Marktquoten</span>
            <span className={styles.detailVal}>{marketApplied ? 'angewandt' : 'kein Signal'}</span>
            <span className={styles.detailKey}>Kalibrierung</span>
            <span className={styles.detailVal}>{calibrated ? 'Platt' : 'Shrink'}</span>
            {drawBlocked && (
              <>
                <span className={styles.detailKey}>Unentschieden</span>
                <span className={styles.detailVal}>gesperrt</span>
              </>
            )}
          </div>
        </section>

        {/* Top 5 Ergebnisse */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Top-Ergebnisse</h3>
          <div className={styles.scoreList}>
            {top5.map(([score, prob]) => (
              <div key={score} className={styles.scoreRow}>
                <span className={styles.scoreVal} data-numeric>{score}</span>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreBarFill}
                    style={{ width: `${(prob / top5[0][1]) * 100}%` }}
                  />
                </div>
                <span className={styles.scoreProb} data-numeric>{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.safeBottom} />
      </div>
    </div>
  );
}
