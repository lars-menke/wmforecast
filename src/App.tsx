import { useState, useCallback } from 'react';
import { useMatches } from './lib/useMatches';
import { useTheme } from './lib/useTheme';
import { useStandings } from './lib/useStandings';
import type { MatchEntry } from './lib/useMatches';
import GroupScreen from './screens/GroupScreen';
import KnockoutScreen from './screens/KnockoutScreen';
import SimulationScreen from './screens/SimulationScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './components/SplashScreen';
import MatchDetailSheet from './components/MatchDetailSheet';
import TrophyIcon from './components/TrophyIcon';
import styles from './App.module.css';

export default function App() {
  useTheme();
  const [splashDone, setSplashDone]       = useState(false);
  const [activeMatch, setActiveMatch]     = useState<MatchEntry | null>(null);
  const [showSettings, setShowSettings]   = useState(false);
  const state = useMatches();
  const [simTab, setSimTab] = useState(false);
  const { tab, setTab, selectedGroup, setSelectedGroup, matches, loading, error, retry, liveCount, resultsMap } = state;
  const { standings, loading: standingsLoading } = useStandings(resultsMap);

  const handleCardClick  = useCallback((m: MatchEntry) => setActiveMatch(m), []);
  const handleSheetClose = useCallback(() => setActiveMatch(null), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className={styles.root}>
        {/* Navigation Header */}
        <header className={styles.header}>
          {/* Wordmark + Trophy */}
          <div className={styles.wordmark} aria-label="WMForecast">
            <TrophyIcon height={34} className={styles.wordmarkTrophy} />
            <span className={styles.wordmarkWm}>WM</span>
            <span className={styles.wordmarkForecast}>Forecast</span>
          </div>

          {/* Segmented Control */}
          {!showSettings && (
            <div className={`${styles.segmented} ${styles.segmented3}`}>
              <button
                className={`${styles.seg}${!simTab && tab === 'group' ? ` ${styles.segActive}` : ''}`}
                onClick={() => { setSimTab(false); setTab('group'); }}
                type="button"
              >
                Gruppen
              </button>
              <button
                className={`${styles.seg}${!simTab && tab === 'knockout' ? ` ${styles.segActive}` : ''}`}
                onClick={() => { setSimTab(false); setTab('knockout'); }}
                type="button"
              >
                K.o.
              </button>
              <button
                className={`${styles.seg}${simTab ? ` ${styles.segActive}` : ''}`}
                onClick={() => setSimTab(true)}
                type="button"
              >
                Prognose
              </button>
            </div>
          )}
          {showSettings && <span className={styles.headerFill} />}

          {/* Live indicator */}
          {liveCount > 0 && !showSettings && (
            <div className={styles.liveIndicator} aria-label={`${liveCount} Spiel${liveCount > 1 ? 'e' : ''} live`}>
              <span className={styles.liveDot} aria-hidden="true" />
              <span className={styles.liveCount}>{liveCount}</span>
            </div>
          )}

          {/* Settings-Button */}
          <button
            className={`${styles.iconBtn}${showSettings ? ` ${styles.iconBtnActive}` : ''}`}
            onClick={() => setShowSettings(s => !s)}
            type="button"
            aria-label="Einstellungen"
          >
            {showSettings ? (
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M2.5 14.5l12-12M2.5 2.5l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </header>

        {/* Inhalt */}
        <main className={styles.main}>
          {showSettings && (
            <SettingsScreen onClose={() => setShowSettings(false)} />
          )}

          {!showSettings && loading && (
            <div className={styles.skeletonList} aria-label="Laedt" aria-busy="true">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={styles.skeletonCard} style={{ '--card-index': i } as React.CSSProperties}>
                  <div className={styles.skeletonRow}>
                    <div className={`${styles.skeletonBar} ${styles.short}`} />
                    <div className={`${styles.skeletonBar} ${styles.short}`} />
                  </div>
                  <div className={styles.skeletonRow}>
                    <div className={`${styles.skeletonBar} ${styles.circle}`} />
                    <div className={`${styles.skeletonBar} ${styles.circle}`} />
                  </div>
                  <div className={`${styles.skeletonBar} ${styles.full}`} />
                </div>
              ))}
            </div>
          )}
          {!showSettings && error && !loading && (
            <div className={styles.center} style={{ flexDirection: 'column' }}>
              <p className={styles.errorText}>{error}</p>
              <button className={styles.retryBtn} onClick={retry} type="button">Erneut versuchen</button>
            </div>
          )}
          {!showSettings && !loading && !error && !simTab && tab === 'group' && (
            <GroupScreen
              matches={matches}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              onMatchClick={handleCardClick}
              standings={standings}
              standingsLoading={standingsLoading}
            />
          )}
          {!showSettings && !loading && !error && !simTab && tab === 'knockout' && (
            <KnockoutScreen matches={matches} onMatchClick={handleCardClick} />
          )}
          {!showSettings && !loading && !error && simTab && (
            <SimulationScreen resultsMap={resultsMap} />
          )}
        </main>
      </div>

      <MatchDetailSheet match={activeMatch} onClose={handleSheetClose} />
    </>
  );
}
