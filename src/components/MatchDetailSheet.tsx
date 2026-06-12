import { useEffect, useRef, useState } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { fetchMatchDetail, type MatchDetail, type GoalEvent, type CardEvent } from '../lib/fetchResults';
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

function GoalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M6.5 2.5L8 5.5H11L8.5 7.5L9.5 10.5L6.5 8.5L3.5 10.5L4.5 7.5L2 5.5H5L6.5 2.5Z"
        fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

function YellowCardIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="8" height="11" rx="1.5" fill="var(--system-yellow)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
    </svg>
  );
}

function RedCardIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="8" height="11" rx="1.5" fill="var(--system-red)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
    </svg>
  );
}

type TimelineEvent =
  | { kind: 'goal'; data: GoalEvent; team: 'H' | 'A' }
  | { kind: 'card'; data: CardEvent; team: 'H' | 'A' };

function buildTimeline(goals: GoalEvent[], cards: CardEvent[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...goals.map(g => ({ kind: 'goal' as const, data: g, team: g.team })),
    ...cards.map(c => ({ kind: 'card' as const, data: c, team: c.team })),
  ];
  return events.sort((a, b) => {
    const ma = a.kind === 'goal' ? a.data.minute : a.data.minute;
    const mb = b.kind === 'goal' ? b.data.minute : b.data.minute;
    return ma - mb;
  });
}

type DetailRowProps = { label: string; value: string; hint: string };
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
  const [visible, setVisible]           = useState(false);
  const [detail, setDetail]             = useState<MatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (match) {
      requestAnimationFrame(() => setVisible(true));
      if ((match.finished || match.live) && match.espnId) {
        setDetail({ goals: match.goals ?? [], cards: [], stats: [] });
        setDetailLoading(true);
        fetchMatchDetail(match.espnId)
          .then(d => { if (d) setDetail(d); })
          .catch(() => {})
          .finally(() => setDetailLoading(false));
      } else {
        setDetail(null);
        setDetailLoading(false);
      }
    } else {
      setVisible(false);
      setDetail(null);
    }
  }, [match]);

  // Poll for live updates while the sheet is open
  useEffect(() => {
    if (!match?.live || !match.espnId) return;
    const id = setInterval(() => {
      fetchMatchDetail(match.espnId!)
        .then(d => { if (d) setDetail(d); })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [match?.live, match?.espnId]);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }
  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  const touchStartY = useRef(0);
  function onTouchStart(e: React.TouchEvent) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) handleClose();
  }

  if (!match) return null;

  const { home, away, result, actual, finished, live, kickoff, venue } = match;
  const homeNation = NATIONS[home];
  const awayNation = NATIONS[away];
  const { pH, pD, pA, lH, lA, naturalTipp, srt, lambdaDiff, marketApplied, calibrated, drawBlocked } = result;
  const top5 = srt.slice(0, 5);
  const timeline = buildTimeline(detail?.goals ?? [], detail?.cards ?? []);
  const stats    = detail?.stats ?? [];
  const possession = stats.find(s => s.key === 'possessionPct');
  const otherStats = stats.filter(s => s.key !== 'possessionPct');

  const liveScore = live && actual;
  const g1 = liveScore ? (actual.g1Live ?? 0) : actual?.g1;
  const g2 = liveScore ? (actual.g2Live ?? 0) : actual?.g2;

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

        {/* Header */}
        <div className={styles.teams}>
          <div className={styles.teamCol}>
            <TeamLogo code={home} size={48} />
            <span className={styles.teamName}>{homeNation?.name ?? home}</span>
          </div>
          <div className={styles.vsBox}>
            {(finished || live) && actual != null ? (
              <span className={`${styles.result}${live ? ` ${styles.resultLive}` : ''}`} data-numeric>
                {g1}:{g2}
              </span>
            ) : (
              <span className={styles.vs}>vs</span>
            )}
            {live && <span className={styles.livePill}>Live</span>}
            <span className={styles.date}>{formatKickoff(kickoff)}</span>
            {venue && <span className={styles.venue}>{venue}</span>}
          </div>
          <div className={`${styles.teamCol} ${styles.teamColRight}`}>
            <TeamLogo code={away} size={48} />
            <span className={styles.teamName}>{awayNation?.name ?? away}</span>
          </div>
        </div>

        {/* Spielverlauf (Timeline) */}
        {(finished || live) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Spielverlauf
              {detailLoading && <span className={styles.loadingDot} aria-label="Lädt" />}
            </h3>

            {timeline.length === 0 && !detailLoading && (
              <p className={styles.empty}>Keine Ereignisse verfügbar</p>
            )}

            {timeline.length > 0 && (
              <div className={styles.timeline}>
                {timeline.map((ev, i) => {
                  const isHome = ev.team === 'H';
                  const min = ev.kind === 'goal' ? ev.data.minute : ev.data.minute;

                  if (ev.kind === 'goal') {
                    const suffix = ev.data.type === 'OWN' ? ' (ET)'
                      : ev.data.type === 'PENALTY' ? ' (E)'
                      : '';
                    return (
                      <div key={i} className={`${styles.tlRow} ${isHome ? styles.tlHome : styles.tlAway}`}>
                        <div className={styles.tlHome}>
                          {isHome && (
                            <span className={`${styles.tlContent} ${styles.tlContentHome}`}>
                              <span className={styles.tlName}>{ev.data.scorer}{suffix}</span>
                              <span className={styles.tlGoalIcon}><GoalIcon /></span>
                            </span>
                          )}
                        </div>
                        <span className={styles.tlMin} data-numeric>{min}'</span>
                        <div className={styles.tlAway}>
                          {!isHome && (
                            <span className={`${styles.tlContent} ${styles.tlContentAway}`}>
                              <span className={styles.tlGoalIcon}><GoalIcon /></span>
                              <span className={styles.tlName}>{ev.data.scorer}{suffix}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Card
                  const icon = ev.data.card === 'RED' ? <RedCardIcon /> : <YellowCardIcon />;
                  return (
                    <div key={i} className={styles.tlRow}>
                      <div className={styles.tlHome}>
                        {isHome && (
                          <span className={`${styles.tlContent} ${styles.tlContentHome}`}>
                            <span className={styles.tlName}>{ev.data.player}</span>
                            <span className={styles.tlCardIcon}>{icon}</span>
                          </span>
                        )}
                      </div>
                      <span className={styles.tlMin} data-numeric>{min}'</span>
                      <div className={styles.tlAway}>
                        {!isHome && (
                          <span className={`${styles.tlContent} ${styles.tlContentAway}`}>
                            <span className={styles.tlCardIcon}>{icon}</span>
                            <span className={styles.tlName}>{ev.data.player}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Statistiken */}
        {stats.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Statistiken</h3>

            {possession && (
              <div className={styles.possessionRow}>
                <span className={styles.possessionVal} data-numeric>{possession.home}%</span>
                <div className={styles.possessionBar}>
                  <div
                    className={styles.possessionHome}
                    style={{ width: `${possession.home}%` }}
                  />
                </div>
                <span className={styles.possessionVal} data-numeric>{possession.away}%</span>
              </div>
            )}

            {otherStats.map(s => {
              const total = s.home + s.away;
              const homePct = total > 0 ? (s.home / total) * 100 : 50;
              return (
                <div key={s.key} className={styles.statRow}>
                  <span className={styles.statVal} data-numeric>{s.home}</span>
                  <div className={styles.statBarWrap}>
                    <div className={styles.statBarTrack}>
                      <div className={styles.statBarHome} style={{ width: `${homePct}%` }} />
                    </div>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                  <span className={styles.statVal} data-numeric>{s.away}</span>
                </div>
              );
            })}
          </section>
        )}

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

        {/* Modell-Parameter */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Modell-Parameter</h3>
          <div className={styles.detailGrid}>
            <DetailRow label={`xG ${homeNation?.shortName ?? home}`} value={lH.toFixed(2)}
              hint="Erwartete Tore aus historischer Angriffs- und Abwehrbilanz" />
            <DetailRow label={`xG ${awayNation?.shortName ?? away}`} value={lA.toFixed(2)}
              hint="Erwartete Tore aus historischer Angriffs- und Abwehrbilanz" />
            <DetailRow label="Lambda-Differenz"
              value={`${lambdaDiff >= 0 ? '+' : ''}${lambdaDiff.toFixed(2)}`}
              hint="Stärkeunterschied beider Teams; >0 bedeutet Heimteam stärker" />
            <DetailRow label="Tipp" value={naturalTipp ?? '-'}
              hint="Wahrscheinlichstes Ergebnis in Richtung der vorhergesagten Seite" />
            <DetailRow label="Marktquoten"
              value={marketApplied ? 'angewandt' : 'kein Signal'}
              hint={marketApplied
                ? 'Newton-Raphson-Korrektur auf Buchmacher-Implizitwahrscheinlichkeiten'
                : 'Keine Buchmacher-Quoten verfügbar, reine Modell-Prognose'} />
            <DetailRow label="Kalibrierung"
              value={calibrated ? 'Platt' : 'Shrink'}
              hint={calibrated
                ? 'Sigmoid-Transformation trainiert auf WM 2018 & 2022'
                : 'Prior-Shrinkage: 88% zum Gleichgewicht 1/3 je Ausgang'} />
            {drawBlocked && (
              <DetailRow label="Remis gesperrt" value="aktiv"
                hint="Bei stark asymmetrischen Duellen wird Remis als Prognose ausgeschlossen" />
            )}
          </div>
        </section>

        {/* Wahrscheinlichste Ergebnisse */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Wahrscheinlichste Ergebnisse</h3>
          <p className={styles.sectionHint}>Aus der Poisson-Matrix, sortiert nach Wahrscheinlichkeit</p>
          <div className={styles.scoreList}>
            {top5.map(([score, prob]) => (
              <div key={score} className={styles.scoreRow}>
                <span className={styles.scoreVal} data-numeric>{score}</span>
                <div className={styles.scoreBar}>
                  <div className={styles.scoreBarFill} style={{ width: `${(prob / top5[0][1]) * 100}%` }} />
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
