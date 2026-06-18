import { useEffect, useState } from 'react';
import trophyImg from '../assets/trophy-new.png';
import mascotsImg from '../assets/mascots.png';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

const SPLASH_DURATION = 2000;
const HOLD_AFTER_FULL = 200;
const FADE_DURATION = 400;

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    let fadeTimer: ReturnType<typeof setTimeout>;
    let doneTimer: ReturnType<typeof setTimeout>;

    function tick(now: number) {
      const p = Math.min((now - start) / SPLASH_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Only fade once the bar has visibly reached 100%
        fadeTimer = setTimeout(() => setFading(true), HOLD_AFTER_FULL);
        doneTimer = setTimeout(() => onDone(), HOLD_AFTER_FULL + FADE_DURATION);
      }
    }
    raf = requestAnimationFrame(tick);

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

      <img src={mascotsImg} alt="" className={styles.mascots} aria-hidden="true" />

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
