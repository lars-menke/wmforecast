import React from 'react';
import { NATIONS } from '../lib/nations';
import type { MatchEntry } from '../lib/useMatches';
import TeamLogo from './TeamLogo';
import styles from './MatchCard.module.css';

type Props = {
  match: MatchEntry;
  onClick?: () => void;
  style?: React.CSSProperties;
};

type Category = {
  label: string;
  badge: 'badgeFav' | 'badgeEdge' | 'badgeFiftyFifty';
};

function getCategory(fp: number): Category {
  if (fp >= 0.70) return { label: 'Favorit', badge: 'badgeFav' };
  if (fp >= 0.55) return { label: 'Kante',   badge: 'badgeEdge' };
  return             { label: '50/50',     badge: 'badgeFiftyFifty' };
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function isMatchLive(kickoff: string, finished: boolean): boolean {
  if (finished) return false;
  const elapsed = Date.now() - new Date(kickoff).getTime();
  return elapsed > 0 && elapsed < 115 * 60 * 1000;
}

export default function MatchCard({ match, onClick, style }: Props) {
  const { home, away, result, finished, actual } = match;
  const homeNation = NATIONS[home];
  const awayNation = NATIONS[away];
  const { pH, pD, pA, naturalTipp, wo, fp } = result;
  const cat    = getCategory(fp);
  const topTip = fp >= 0.70 && !finished;
  const live   = isMatchLive(match.kickoff, finished);

  return (
    <button
      className={`${styles.card}${topTip ? ` ${styles.cardTop}` : ''}`}
      onClick={onClick}
      style={style}
      type="button"
    >
      <div className={styles.inner}>

        {/* Grid: date | score (spans 2 rows) | badges */}
        <span className={styles.meta}>{formatKickoff(match.kickoff)}</span>

        <div className={styles.scoreBox}>
          {finished && actual ? (
            <>
              <span className={styles.score} data-numeric>{actual.g1}:{actual.g2}</span>
              <span className={styles.scoreLabel}>Ergebnis</span>
            </>
          ) : (
            <>
              <span className={`${styles.score} ${styles.scoreTipp}`} data-numeric>
                {naturalTipp ?? '–'}
              </span>
              <span className={styles.scoreLabel}>{live ? 'Live' : 'Tipp'}</span>
            </>
          )}
        </div>

        <div className={styles.badges}>
          {live && <span className={`${styles.badge} ${styles.badgeLive}`}>● Live</span>}
          {topTip && !live && <span className={`${styles.badge} ${styles.badgeTopTip}`}>TOP</span>}
          <span className={`${styles.badge} ${styles[cat.badge]}`}>{cat.label}</span>
        </div>

        <div className={styles.teamLeft}>
          <TeamLogo code={home} size={32} />
          <span className={`${styles.teamName}${wo === 'H' && !finished ? ` ${styles.teamNameFav}` : ''}`}>
            {homeNation?.name ?? home}
          </span>
        </div>

        {/* scoreBox already placed above, spans rows 1+2 */}

        <div className={styles.teamRight}>
          <span className={`${styles.teamName}${wo === 'A' && !finished ? ` ${styles.teamNameFav}` : ''}`}>
            {awayNation?.name ?? away}
          </span>
          <TeamLogo code={away} size={32} />
        </div>

        {/* Probability grid */}
        <div className={styles.probGrid}>
          <div className={`${styles.probCell}${wo === 'H' ? ` ${styles.probCellHome}` : ''}`}>
            <span className={styles.probPct} data-numeric>{(pH * 100).toFixed(0)}%</span>
            <span className={styles.probLbl}>Heimsieg</span>
          </div>
          <div className={`${styles.probCell}${wo === 'D' ? ` ${styles.probCellDraw}` : ''}`}>
            <span className={styles.probPct} data-numeric>{(pD * 100).toFixed(0)}%</span>
            <span className={styles.probLbl}>Remis</span>
          </div>
          <div className={`${styles.probCell}${wo === 'A' ? ` ${styles.probCellAway}` : ''}`}>
            <span className={styles.probPct} data-numeric>{(pA * 100).toFixed(0)}%</span>
            <span className={styles.probLbl}>Auswärtssieg</span>
          </div>
        </div>

      </div>
    </button>
  );
}
