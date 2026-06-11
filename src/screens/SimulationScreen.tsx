import { useEffect, useState } from 'react';
import { simulateWithUncertainty, type SimResultWithBands } from '../lib/simulation';
import { NATIONS } from '../lib/nations';
import type { MatchResult } from '../lib/fetchResults';
import TeamLogo from '../components/TeamLogo';
import styles from './SimulationScreen.module.css';

type Props = {
  resultsMap: Record<string, MatchResult>;
};

const N_PARAM_DRAWS = 30;
const N_SIMS_EACH   = 300;

function pct(v: number, decimals = 1): string {
  return (v * 100).toFixed(decimals) + '%';
}

type Row = {
  code: string;
  title:    { median: number; low: number; high: number };
  top4:     { median: number; low: number; high: number };
  groupAdv: { median: number; low: number; high: number };
};

export default function SimulationScreen({ resultsMap }: Props) {
  const [result, setResult] = useState<SimResultWithBands | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'title' | 'top4' | 'advance'>('title');
  const [bonusOpen, setBonusOpen] = useState(false);

  useEffect(() => {
    setRunning(true);
    setResult(null);
    // Defer to next tick so the loading state renders first
    const id = setTimeout(() => {
      const r = simulateWithUncertainty(resultsMap, N_PARAM_DRAWS, N_SIMS_EACH);
      setResult(r);
      setRunning(false);
    }, 20);
    return () => clearTimeout(id);
  }, [resultsMap]);

  const rows: Row[] = result
    ? Object.keys(NATIONS)
        .filter(c => result.title[c] !== undefined)
        .map(code => ({
          code,
          title:    result.title[code],
          top4:     result.top4[code],
          groupAdv: result.groupAdvance[code],
        }))
        .sort((a, b) => b.title.median - a.title.median)
    : [];

  // Derive bonus tips from simulation
  const bonusWeltmeister = rows[0]?.code ?? null;
  const bonusHalbfinale  = rows.slice(0, 4).map(r => r.code);

  // Top scorer: team with highest attack stat (most goals expected regardless of title)
  const TOP_SCORER_BY_TEAM: Record<string, string> = {
    FRA: 'K. Mbappé (FRA)', ARG: 'J. Álvarez (ARG)', BRA: 'Vinicius Jr. (BRA)',
    ESP: 'L. Yamal (ESP)',  ENG: 'H. Kane (ENG)',    POR: 'C. Ronaldo (POR)',
    NED: 'C. Gakpo (NED)', GER: 'F. Wirtz (GER)',   BEL: 'L. Trossard (BEL)',
    COL: 'L. Díaz (COL)',
  };
  const bonusTopScorer = TOP_SCORER_BY_TEAM['FRA']; // FRA = höchste Angriffsquote (1.93)

  const activeRows = rows.slice().sort((a, b) => {
    if (tab === 'top4')    return b.top4.median    - a.top4.median;
    if (tab === 'advance') return b.groupAdv.median - a.groupAdv.median;
    return b.title.median - a.title.median;
  });

  const maxVal = activeRows[0]
    ? tab === 'title'   ? activeRows[0].title.median
    : tab === 'top4'    ? activeRows[0].top4.median
    : activeRows[0].groupAdv.median
    : 1;

  function getBand(row: Row) {
    if (tab === 'top4')    return row.top4;
    if (tab === 'advance') return row.groupAdv;
    return row.title;
  }

  return (
    <div className={styles.root}>
      {/* Sub-header */}
      <div className={styles.metaBar}>
        <span className={styles.metaText}>
          Monte-Carlo · {N_PARAM_DRAWS} × {N_SIMS_EACH} = {(N_PARAM_DRAWS * N_SIMS_EACH).toLocaleString('de-DE')} Turniere
        </span>
        <span className={styles.metaText}>Poisson + Elo-Ensemble</span>
      </div>

      {/* Sub-tabs */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab}${tab === 'title' ? ` ${styles.subTabActive}` : ''}`}
          onClick={() => setTab('title')}
          type="button"
        >Titelchance</button>
        <button
          className={`${styles.subTab}${tab === 'top4' ? ` ${styles.subTabActive}` : ''}`}
          onClick={() => setTab('top4')}
          type="button"
        >Top 4</button>
        <button
          className={`${styles.subTab}${tab === 'advance' ? ` ${styles.subTabActive}` : ''}`}
          onClick={() => setTab('advance')}
          type="button"
        >Gruppenphase</button>
      </div>

      {running && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Simuliere {(N_PARAM_DRAWS * N_SIMS_EACH).toLocaleString('de-DE')} Turniere…</span>
        </div>
      )}

      {!running && result && (
        <div className={styles.list}>
          {/* Bonus-Tipps */}
          <div className={styles.bonusCard}>
            <button
              className={styles.bonusHeader}
              onClick={() => setBonusOpen(o => !o)}
              type="button"
              aria-expanded={bonusOpen}
            >
              <span className={styles.bonusTitle}>Bonus-Tipps</span>
              <svg
                className={`${styles.bonusChevron}${bonusOpen ? ` ${styles.bonusChevronOpen}` : ''}`}
                width="16" height="16" viewBox="0 0 16 16" fill="none"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {bonusOpen && (
              <div className={styles.bonusGrid}>
                <div className={styles.bonusItem}>
                  <span className={styles.bonusLabel}>Weltmeister</span>
                  <span className={styles.bonusValue}>
                    {bonusWeltmeister
                      ? `${NATIONS[bonusWeltmeister]?.flag ?? ''} ${NATIONS[bonusWeltmeister]?.name ?? bonusWeltmeister}`
                      : '—'}
                  </span>
                </div>
                <div className={styles.bonusItem}>
                  <span className={styles.bonusLabel}>Torschützenkönig</span>
                  <span className={styles.bonusValue}>{bonusTopScorer}</span>
                </div>
                <div className={styles.bonusItem}>
                  <span className={styles.bonusLabel}>Halbfinale</span>
                  <span className={styles.bonusValue}>
                    {bonusHalbfinale.join(' · ')}
                  </span>
                </div>
                <div className={styles.bonusItem}>
                  <span className={styles.bonusLabel}>Gruppensieger</span>
                  <span className={styles.bonusValue}>
                    A: MEX · B: SUI · C: BRA · D: TUR<br />
                    E: GER · F: NED · G: BEL · H: ESP<br />
                    I: FRA · J: ARG · K: POR · L: ENG
                  </span>
                </div>
              </div>
            )}
          </div>

          {activeRows.map((row, idx) => {
            const band = getBand(row);
            const nation = NATIONS[row.code];
            const barWidth = maxVal > 0 ? (band.median / maxVal) * 100 : 0;
            const bandLow  = maxVal > 0 ? (band.low  / maxVal) * 100 : 0;
            const bandHigh = maxVal > 0 ? (band.high / maxVal) * 100 : 0;

            return (
              <div key={row.code} className={styles.row}>
                <span className={styles.rank} data-numeric>#{idx + 1}</span>
                <TeamLogo code={row.code} size={28} />
                <span className={styles.name}>{nation?.name ?? row.code}</span>
                <div className={styles.barWrap}>
                  {/* Confidence band */}
                  <div
                    className={styles.bandFill}
                    style={{ left: `${bandLow}%`, width: `${Math.max(0, bandHigh - bandLow)}%` }}
                  />
                  {/* Median bar */}
                  <div className={styles.medianFill} style={{ width: `${barWidth}%` }} />
                </div>
                <div className={styles.vals}>
                  <span className={styles.medianVal} data-numeric>{pct(band.median)}</span>
                  <span className={styles.bandVal} data-numeric>
                    {pct(band.low, 1)}–{pct(band.high, 1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
