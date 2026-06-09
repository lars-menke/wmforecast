import { useState, useEffect } from 'react';
import styles from './ProbabilityBar.module.css';

type Props = {
  home: number;
  draw: number;
  away: number;
};

export default function ProbabilityBar({ home, draw, away }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hPct = (home * 100).toFixed(0);
  const dPct = (draw * 100).toFixed(0);
  const aPct = (away * 100).toFixed(0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={`${styles.seg} ${styles.home}`} style={{ width: mounted ? `${home * 100}%` : '0%' }} />
        <div className={`${styles.seg} ${styles.draw}`} style={{ width: mounted ? `${draw * 100}%` : '0%' }} />
        <div className={`${styles.seg} ${styles.away}`} style={{ width: mounted ? `${away * 100}%` : '0%' }} />
      </div>
      <div className={styles.labels}>
        <span className={styles.labelHome} data-numeric>{hPct}%</span>
        <span className={styles.labelDraw}  data-numeric>{dPct}%</span>
        <span className={styles.labelAway}  data-numeric>{aPct}%</span>
      </div>
    </div>
  );
}
