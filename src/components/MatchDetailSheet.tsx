import { useEffect, useRef, useState } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { fetchMatchDetail, type GoalEvent } from '../lib/fetchResults';
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

type DetailRowProps = {
  label: string;
  value: string;
  hint: string;
};

function DetailRow({ label, value, hint }: DetailRowProps) {
  return (
    <div className={styles.detailRow}>
      <div className={styles.detailLeft}>
        <span className={styles.detailKey}>{label}</span>
        <span className={styles.detailHint}>{hint}</span>
      </div>
      <span className={styles.detailVal} data-numeric>{value}</span>
    </div>
  );
}

export default function MatchDetailSheet({ match, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [goals, setGoals]     = useState<GoalEvent[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (match) {
      requestAnimationFrame(() => setVisible(true));
      // Load goal detail for finished/live matches
      if ((match.finished || match.live) && match.actual) {
        setGoals(match.goals ?? []);
        if (match.fdId) {
          fetchMatchDetail(match.fdId).then(r => { if (r?.goals) setGoals(r.goals); }).catch(() => {});
        }
      } else {
        setGoals([]);
      }
    } else {
      setVisible(false);
      setGoals([]);
    }
  }, [match]);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

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

        {/* Prognose */}
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
          <h3 className={styles.sectionTitle}>Modell-Parameter</h3>
          <div className={styles.detailGrid}>
            <DetailRow
              label={`xG ${homeNation?.shortName ?? home}`}
              value={lH.toFixed(2)}
              hint="Erwartete Tore aus historischer Angriffs- und Abwehrbilanz"
            />
            <DetailRow
              label={`xG ${awayNation?.shortName ?? away}`}
              value={lA.toFixed(2)}
              hint="Erwartete Tore aus historischer Angriffs- und Abwehrbilanz"
            />
            <DetailRow
              label="Lambda-Differenz"
              value={`${lambdaDiff >= 0 ? '+' : ''}${lambdaDiff.toFixed(2)}`}
              hint="Stärkeunterschied beider Teams; >0 bedeutet Heimteam stärker"
            />
            <DetailRow
              label="Tipp"
              value={naturalTipp ?? '-'}
              hint="Wahrscheinlichstes Ergebnis in Richtung der vorhergesagten Seite"
            />
            <DetailRow
              label="Marktquoten"
              value={marketApplied ? 'angewandt' : 'kein Signal'}
              hint={marketApplied
                ? 'Newton-Raphson-Korrektur auf Buchmacher-Implizitwahrscheinlichkeiten'
                : 'Keine Buchmacher-Quoten verfügbar, reine Modell-Prognose'}
            />
            <DetailRow
              label="Kalibrierung"
              value={calibrated ? 'Platt' : 'Shrink'}
              hint={calibrated
                ? 'Sigmoid-Transformation trainiert auf WM 2018 & 2022'
                : 'Prior-Shrinkage: 88 % zum Gleichgewicht 1/3 je Ausgang'}
            />
            {drawBlocked && (
              <DetailRow
                label="Remis gesperrt"
                value="aktiv"
                hint="Bei stark asymmetrischen Duellen wird Remis als Prognose ausgeschlossen"
              />
            )}
          </div>
        </section>

        {/* Top-Ergebnisse */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Wahrscheinlichste Ergebnisse</h3>
          <p className={styles.sectionHint}>
            Alle Ergebnisse aus der Poisson-Matrix, sortiert nach Einzel-Wahrscheinlichkeit
          </p>
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

        {/* Torschützen */}
        {goals.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Torschützen</h3>
            <div className={styles.goalList}>
              {goals.map((g, i) => (
                <div key={i} className={styles.goalRow}>
                  <span className={styles.goalMinute} data-numeric>{g.minute}'</span>
                  <span className={styles.goalScorer}>{g.scorer}</span>
                  <span className={styles.goalTeam}>{g.team === 'H' ? homeNation?.shortName ?? match.home : awayNation?.shortName ?? match.away}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={styles.safeBottom} />
      </div>
    </div>
  );
}
