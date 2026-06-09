import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const doneTimer = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`${styles.root}${fading ? ` ${styles.fadeOut}` : ''}`}>
      <div className={styles.iconWrap}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <rect width="80" height="80" rx="20" fill="var(--icon-bg)" />
          {/* Fussball */}
          <circle cx="40" cy="40" r="22" stroke="var(--icon-white)" strokeWidth="2.5" fill="none" />
          <path d="M40 18 L40 62 M18 40 L62 40 M22 25 L58 55 M58 25 L22 55"
            stroke="var(--icon-white)" strokeWidth="1.5" strokeOpacity="0.25" />
          {/* Stern */}
          <path d="M40 22 L41.8 28 L48 28 L43 31.5 L44.8 37.5 L40 34 L35.2 37.5 L37 31.5 L32 28 L38.2 28 Z"
            fill="var(--icon-accent)" />
        </svg>
      </div>

      <div className={styles.brand}>
        <span className={styles.brandWm}>WM</span>
        <span className={styles.brandForecast}>Forecast</span>
      </div>

      <p className={styles.sub}>WM 2026 · Prognose</p>

      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
