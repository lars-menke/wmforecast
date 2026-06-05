import { NATIONS } from '../lib/nations';
import type { MatchEntry } from '../lib/useMatches';
import ProbabilityBar from './ProbabilityBar';
import TeamLogo from './TeamLogo';
import styles from './MatchCard.module.css';

type Props = {
  match: MatchEntry;
  onClick?: () => void;
};

type Category = {
  label: string;
  badge: 'badgeFav' | 'badgeEdge' | 'badgeFiftyFifty';
  stripe: 'stripeGold' | 'stripeBlue' | 'stripeGray';
};

function getCategory(fp: number): Category {
  if (fp >= 0.70) return { label: 'Favorit',  badge: 'badgeFav',       stripe: 'stripeGold' };
  if (fp >= 0.55) return { label: 'Kante',     badge: 'badgeEdge',      stripe: 'stripeBlue' };
  return             { label: '50/50',      badge: 'badgeFiftyFifty', stripe: 'stripeGray' };
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function tippScore(match: MatchEntry): string | null {
  const { result, finished, actual } = match;
  if (finished && actual) return `${actual.g1}:${actual.g2}`;
  return result.naturalTipp;
}

export default function MatchCard({ match, onClick }: Props) {
  const { home, away, result, finished } = match;
  const homeNation = NATIONS[home];
  const awayNation = NATIONS[away];
  const cat        = getCategory(result.fp);
  const topTip     = result.fp >= 0.70 && !finished;
  const score      = tippScore(match);
  const wo         = result.wo;

  return (
    <button
      className={`${styles.card}${topTip ? ` ${styles.cardTop}` : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={`${styles.accentStripe} ${styles[cat.stripe]}`} />
      <div className={styles.inner}>

        <div className={styles.header}>
          <span className={styles.meta}>{formatKickoff(match.kickoff)}</span>
          <div className={styles.badges}>
            {topTip && <span className={`${styles.badge} ${styles.badgeTopTip}`}>TOP</span>}
            <span className={`${styles.badge} ${styles[cat.badge]}`}>{cat.label}</span>
          </div>
        </div>

        <div className={styles.body}>
          <div className={`${styles.team} ${wo === 'H' && !finished ? styles.teamFav : ''}`}>
            <TeamLogo code={home} size={28} />
            <span className={styles.teamName}>{homeNation?.shortName ?? home}</span>
          </div>

          <div className={styles.scoreBox}>
            {score && (
              <span className={`${styles.score} ${finished ? styles.scoreResult : styles.scoreTipp}`} data-numeric>
                {score}
              </span>
            )}
            {finished && <span className={styles.scoreLabel}>Ergebnis</span>}
            {!finished && score && <span className={styles.scoreLabel}>Tipp</span>}
          </div>

          <div className={`${styles.team} ${styles.teamRight} ${wo === 'A' && !finished ? styles.teamFav : ''}`}>
            <TeamLogo code={away} size={28} />
            <span className={styles.teamName}>{awayNation?.shortName ?? away}</span>
          </div>
        </div>

        <ProbabilityBar home={result.pH} draw={result.pD} away={result.pA} />

      </div>
    </button>
  );
}
