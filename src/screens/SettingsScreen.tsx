import { useEffect, useRef } from 'react';
import { useTheme } from '../lib/useTheme';
import styles from './SettingsScreen.module.css';

const VERSION = __APP_VERSION__;

const MODEL_SECTIONS = [
  {
    id: 'poisson',
    title: 'Poisson-Modell',
    body: 'Jedes Spiel wird als Zufallsexperiment modelliert. Die erwarteten Tore (xG) beider Teams berechnen sich aus historischen Länderspiel-Statistiken. Die Wahrscheinlichkeit jedes Ergebnisses ergibt sich aus der Poisson-Verteilung dieser Erwartungswerte.',
  },
  {
    id: 'dc',
    title: 'Dixon-Coles-Korrektur',
    body: 'Ein Korrekturfaktor (ρ = −0,13) justiert die Poisson-Wahrscheinlichkeiten für die Ergebnisse 0:0, 1:0, 0:1 und 1:1, die im echten Fußball häufiger oder seltener auftreten als das reine Modell vorhersagt.',
  },
  {
    id: 'drawboost',
    title: 'Draw Boost',
    body: 'Bei ausgeglichenen Paarungen (λ-Differenz < 0,40) erhöht der Draw Boost die Unentschieden-Wahrscheinlichkeit um bis zu 15 Prozentpunkte — abgeleitet aus der statistisch erhöhten Remisquote bei eng eingestuften Duellen.',
  },
  {
    id: 'neutral',
    title: 'Neutrales Spielfeld',
    body: 'Da die WM auf neutralem Boden stattfindet, werden keine Heim- oder Auswärtsvorteile eingerechnet. Die Stärke-Parameter werden als symmetrische Durchschnittswerte verwendet.',
  },
  {
    id: 'calib',
    title: 'Kalibrierung',
    body: 'Platt-Skalierung transformiert die rohen Modell-Wahrscheinlichkeiten via Sigmoid-Funktion, trainiert auf WM-Daten 2018 & 2022. Fehlt ausreichend Datenbasis, greift ein Prior-Shrinkage (88 % zum Gleichgewicht 1/3).',
  },
  {
    id: 'market',
    title: 'Marktquoten-Korrektur',
    body: 'Sind Buchmacher-Quoten verfügbar (The Odds API), korrigiert ein Newton-Raphson-Algorithmus die Lambdas iterativ, bis die Modell-Wahrscheinlichkeiten mit den impliziten Marktwahrscheinlichkeiten übereinstimmen.',
  },
];

type Props = { onClose: () => void };

export default function SettingsScreen({ onClose }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Schliessen">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 14L14 4M4 4l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Einstellungen</span>
        <span className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>

        {/* Darstellung */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Darstellung</h2>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>Dark Mode</span>
            <button
              className={`${styles.toggle} ${isDark ? styles.toggleOn : ''}`}
              onClick={toggle}
              role="switch"
              aria-checked={isDark}
              type="button"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </section>

        {/* Das Modell */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Das Modell</h2>
          {MODEL_SECTIONS.map((s, i) => (
            <div key={s.id} className={`${styles.modelCell} ${i < MODEL_SECTIONS.length - 1 ? styles.modelCellBorder : ''}`}>
              <span className={styles.modelTitle}>{s.title}</span>
              <p className={styles.modelBody}>{s.body}</p>
            </div>
          ))}
        </section>

        {/* App-Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>App</h2>
          <div className={`${styles.cell} ${styles.cellBorder}`}>
            <span className={styles.cellLabel}>Version</span>
            <span className={styles.cellValue}>{VERSION}</span>
          </div>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>Datenquellen</span>
            <span className={styles.cellValue}>football-data.org · The Odds API</span>
          </div>
        </section>

        <p className={styles.footer}>
          Prognosen sind statistisch und stellen keine Wettempfehlung dar.
        </p>
      </div>
    </div>
  );
}
