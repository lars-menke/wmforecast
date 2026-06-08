import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const doneTimer = setTimeout(() => onDone(), 1600);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`${styles.root}${fading ? ` ${styles.fadeOut}` : ''}`}>
      <div className={styles.iconWrap}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <rect width="72" height="72" rx="18" fill="var(--icon-bg)" />
          {/* Ball-Silhouette */}
          <circle cx="36" cy="36" r="20" stroke="var(--icon-white)" strokeWidth="2.5" fill="none" />
          <path d="M36 16 L36 56 M16 36 L56 36 M20 22 L52 50 M52 22 L20 50"
            stroke="var(--icon-white)" strokeWidth="1.5" strokeOpacity="0.35" />
          {/* Stern-Akzent */}
          <path d="M36 20 L37.5 25 L43 25 L38.5 28 L40 33 L36 30 L32 33 L33.5 28 L29 25 L34.5 25 Z"
            fill="var(--icon-accent)" />
        </svg>
      </div>
      <p className={styles.title}>WM 2026</p>
      <p className={styles.sub}>Prognose</p>
    </div>
  );
}
