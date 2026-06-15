import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../lib/useTheme';
import styles from './SettingsScreen.module.css';

const ESPN_TEST_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=1';
const ODDS_KEY = import.meta.env.VITE_ODDS_API_KEY ?? '';
const ODDS_TEST_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${ODDS_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`;

type ApiStatus = { state: 'idle' | 'loading' | 'ok' | 'error'; msg: string };

function useApiTest() {
  const [espn, setEspn] = useState<ApiStatus>({ state: 'idle', msg: '' });
  const [odds, setOdds] = useState<ApiStatus>({ state: 'idle', msg: '' });

  async function run() {
    setEspn({ state: 'loading', msg: '' });
    setOdds({ state: 'loading', msg: '' });

    fetch(ESPN_TEST_URL)
      .then(async r => {
        const json = await r.json();
        const count = json.events?.length ?? 0;
        setEspn({ state: 'ok', msg: `${count} Events · HTTP ${r.status}` });
      })
      .catch(e => setEspn({ state: 'error', msg: String(e) }));

    if (!ODDS_KEY) {
      setOdds({ state: 'error', msg: 'Kein API-Key konfiguriert' });
      return;
    }

    // First discover available sport keys
    try {
      const sportsR = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_KEY}`);
      if (!sportsR.ok) {
        setOdds({ state: 'error', msg: `Sports-Liste HTTP ${sportsR.status}` });
        return;
      }
      const sports = await sportsR.json() as Array<{ key: string; title: string; active: boolean }>;
      const wc = sports.find(s => s.key.includes('world') || s.key.includes('cup') || s.key.includes('wc'));
      if (!wc) {
        const keys = sports.filter(s => s.key.startsWith('soccer')).map(s => s.key).join(', ');
        setOdds({ state: 'error', msg: `WM nicht gefunden. Soccer-Keys: ${keys || 'keine'}` });
        return;
      }
      // Use discovered key
      const oddsR = await fetch(`https://api.the-odds-api.com/v4/sports/${wc.key}/odds/?apiKey=${ODDS_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
      const rem = oddsR.headers.get('x-requests-remaining') ?? '?';
      if (!oddsR.ok) {
        setOdds({ state: 'error', msg: `${wc.key} HTTP ${oddsR.status} · ${rem} übrig` });
        return;
      }
      const json = await oddsR.json();
      const count = Array.isArray(json) ? json.length : 0;
      setOdds({ state: 'ok', msg: `${wc.key} · ${count} Spiele · ${rem} übrig` });
    } catch (e) {
      setOdds({ state: 'error', msg: String(e) });
    }
  }

  return { espn, odds, run };
}

const VERSION = __APP_VERSION__;

const PROGNOSE_SECTIONS = [
  {
    id: 'montecarlo',
    title: 'Monte-Carlo-Simulation',
    body: 'Das gesamte Turnier wird 9.000-mal durchgespielt (30 Parametersätze × 300 Simulationen). Jedes Spiel in der Gruppen- und K.o.-Phase wird einzeln simuliert. Das Ergebnis zeigt, wie oft jedes Team in den jeweiligen Runden landet.',
  },
  {
    id: 'ensemble',
    title: 'Poisson + Elo-Ensemble',
    body: 'Die Siegwahrscheinlichkeit jedes Spiels kombiniert das Poisson-Modell (60 %) mit einem Elo-basierten Modell (40 %). Das Elo-Modell nutzt internationale Elo-Ratings und gleicht Verzerrungen aus historischen Statistiken aus.',
  },
  {
    id: 'uncertainty',
    title: 'Parameterunsicherheit',
    body: 'In jedem der 30 Parameterdurchläufe werden Angriffs- und Defensivstärken leicht variiert (Box-Muller-Rauschen, σ = 8 %). Das ergibt Konfidenzband-Spannen (5.–95. Perzentile), die zeigen, wie stabil eine Prognose ist.',
  },
  {
    id: 'ipf',
    title: 'Teamstärken (IPF-Kalibrierung)',
    body: 'Die Angriffs- und Defensivwerte aller 48 Teams wurden per Iterative Proportional Fitting (IPF) auf 1.444 historischen Länderspielen ab 2018 trainiert. Walk-Forward-Backtesting über 6 Zeitfenster ergab optimale Zeitgewichtung ξ = 0.',
  },
  {
    id: 'bonustipps',
    title: 'Bonus-Tipps',
    body: 'Die Empfehlungen für Weltmeister, Torschützenkönig, Halbfinalisten und Gruppensieger werden direkt aus den Simulationsergebnissen abgeleitet: der am häufigsten simulierte Titelgewinner, die stärksten Torchancen-Träger und die wahrscheinlichsten Gruppenführenden.',
  },
];

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

type Props = { onClose: () => void; hasMarket: boolean };

export default function SettingsScreen({ onClose, hasMarket }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const firstRender = useRef(true);
  const { espn, odds, run } = useApiTest();

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

        {/* Prognose-Tab */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Prognose-Tab</h2>
          {PROGNOSE_SECTIONS.map((s, i) => (
            <div key={s.id} className={`${styles.modelCell} ${i < PROGNOSE_SECTIONS.length - 1 ? styles.modelCellBorder : ''}`}>
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
          <div className={`${styles.cell} ${styles.cellBorder}`}>
            <span className={styles.cellLabel}>Datenquellen</span>
            <span className={styles.cellValue}>ESPN API · The Odds API</span>
          </div>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>Marktquoten-Signal</span>
            <span className={styles.cellValue} style={{ color: hasMarket ? 'var(--system-green)' : 'var(--system-orange)' }}>
              {hasMarket ? 'Aktiv' : 'Kein Signal'}
            </span>
          </div>
        </section>

        {/* API-Test */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>API-Diagnose</h2>
          <div className={`${styles.cell} ${styles.cellBorder}`}>
            <span className={styles.cellLabel}>ESPN API</span>
            <span className={styles.cellValue} style={{ color: espn.state === 'ok' ? 'var(--system-green)' : espn.state === 'error' ? 'var(--system-red)' : 'var(--text-secondary)' }}>
              {espn.state === 'idle' ? '--' : espn.state === 'loading' ? '...' : espn.msg}
            </span>
          </div>
          <div className={`${styles.cell} ${styles.cellBorder}`}>
            <span className={styles.cellLabel}>Odds API</span>
            <span className={styles.cellValue} style={{ color: odds.state === 'ok' ? 'var(--system-green)' : odds.state === 'error' ? 'var(--system-red)' : 'var(--text-secondary)' }}>
              {odds.state === 'idle' ? '--' : odds.state === 'loading' ? '...' : odds.msg}
            </span>
          </div>
          <div className={styles.cell}>
            <button
              className={styles.testBtn}
              onClick={run}
              disabled={espn.state === 'loading' || odds.state === 'loading'}
              type="button"
            >
              {espn.state === 'loading' || odds.state === 'loading' ? 'Teste...' : 'APIs testen'}
            </button>
          </div>
        </section>

        <p className={styles.footer}>
          Prognosen sind statistisch und stellen keine Wettempfehlung dar.
        </p>
      </div>
    </div>
  );
}
