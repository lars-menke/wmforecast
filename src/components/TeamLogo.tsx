import { NATIONS } from '../lib/nations';
import { flagSvg } from '../lib/flags';
import styles from './TeamLogo.module.css';

type Props = {
  code: string;
  size?: number;
};

// Kleine Inline-Flagge fuer Textkontexte (Tabellen, Bracket, Listen).
export function Flag({ code, size = 16 }: Props) {
  const svg = flagSvg(code);
  if (!svg) return null;
  return (
    <img
      src={svg}
      alt=""
      aria-hidden="true"
      className={styles.flagImg}
      style={{ width: size, height: size * 0.75 }}
      loading="lazy"
      draggable={false}
    />
  );
}

export default function TeamLogo({ code, size = 32 }: Props) {
  const nation = NATIONS[code];
  const svg = flagSvg(code);

  if (svg) {
    return (
      <img
        src={svg}
        alt={nation?.name ?? code}
        className={styles.flagImg}
        style={{ width: size, height: size * 0.75 }}
        loading="lazy"
        draggable={false}
      />
    );
  }

  // Fallback: Initialen (z.B. TBD-Platzhalter oder unbekannter Code)
  return (
    <span
      className={styles.logo}
      style={{ width: size, height: size * 0.75, fontSize: size * 0.4 }}
      aria-label={nation?.name ?? code}
      role="img"
    >
      {code.slice(0, 2)}
    </span>
  );
}
