import styles from './ProbabilityBar.module.css';

type Props = {
  home: number;
  draw: number;
  away: number;
};

export default function ProbabilityBar({ home, draw, away }: Props) {
  const hPct = (home * 100).toFixed(0);
  const dPct = (draw * 100).toFixed(0);
  const aPct = (away * 100).toFixed(0);

  return (
    <div className={styles.wrapper}>
      <span className={styles.label} data-numeric>{hPct}%</span>
      <div className={styles.track}>
        <div className={`${styles.seg} ${styles.home}`}  style={{ width: `${home * 100}%` }} />
        <div className={`${styles.seg} ${styles.draw}`}  style={{ width: `${draw * 100}%` }} />
        <div className={`${styles.seg} ${styles.away}`}  style={{ width: `${away * 100}%` }} />
      </div>
      <span className={styles.label} data-numeric>{aPct}%</span>
      <span className={styles.drawLabel} data-numeric>{dPct}%</span>
    </div>
  );
}
