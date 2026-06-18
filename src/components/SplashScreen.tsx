import { useEffect, useState } from 'react';
import trophyImg from '../assets/trophy-new.png';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

const SPLASH_DURATION = 2400;
const FADE_START = 1900;

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min(elapsed / SPLASH_DURATION, 1);
      // ease-out: fast start, slows near 100%
      setProgress(1 - Math.pow(1 - p, 2));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const fadeTimer = setTimeout(() => setFading(true), FADE_START);
    const doneTimer = setTimeout(() => onDone(), FADE_START + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
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

      <p className={styles.worldCup}>FIFA World Cup 2026</p>

      <div className={styles.progressSection}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className={styles.progressLabel}>Logging Into Tournament</span>
      </div>
    </div>
  );
}
