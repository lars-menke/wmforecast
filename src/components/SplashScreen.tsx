import { useEffect, useState } from 'react';
import trophyImg from '../assets/trophy-new.png';
import mascotsImg from '../assets/mascots.png';
import styles from './SplashScreen.module.css';

type Props = {
  onDone: () => void;
};

const FADE_START = 2600;
const FADE_DURATION = 400;

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), FADE_START);
    const doneTimer = setTimeout(() => onDone(), FADE_START + FADE_DURATION);
    return () => {
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

      <div className={styles.dots}>
        <div className={styles.dotsRow}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <span className={styles.dotsLabel}>Logging into Tournament</span>
      </div>
    </div>
  );
}
