import { useEffect, useState } from 'react';
import trophyImg from '../assets/trophy-new.png';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    const doneTimer = setTimeout(() => onDone(), 2050);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`${styles.root}${fading ? ` ${styles.fadeOut}` : ''}`}>
      <div className={styles.iconWrap}>
        <img src={trophyImg} alt="WM-Pokal" className={styles.trophy} />
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
