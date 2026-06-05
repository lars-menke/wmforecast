import { NATIONS } from '../lib/nations';
import styles from './TeamLogo.module.css';

type Props = {
  code: string;
  size?: number;
};

export default function TeamLogo({ code, size = 32 }: Props) {
  const nation = NATIONS[code];
  const flag   = nation?.flag;

  return (
    <span
      className={styles.logo}
      style={{ width: size, height: size, fontSize: size * 0.72 }}
      aria-label={nation?.name ?? code}
      role="img"
    >
      {flag ?? code.slice(0, 2)}
    </span>
  );
}
