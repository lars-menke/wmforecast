import { useState, useCallback } from 'react';
import { useMatches } from './lib/useMatches';
import type { MatchEntry } from './lib/useMatches';
import GroupScreen from './screens/GroupScreen';
import KnockoutScreen from './screens/KnockoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './components/SplashScreen';
import MatchDetailSheet from './components/MatchDetailSheet';
import styles from './App.module.css';

export default function App() {
  const [splashDone, setSplashDone]       = useState(false);
  const [activeMatch, setActiveMatch]     = useState<MatchEntry | null>(null);
  const [showSettings, setShowSettings]   = useState(false);
  const state = useMatches();
  const { tab, setTab, selectedGroup, setSelectedGroup, matches, loading, error } = state;

  const handleCardClick  = useCallback((m: MatchEntry) => setActiveMatch(m), []);
  const handleSheetClose = useCallback(() => setActiveMatch(null), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className={styles.root}>
        {/* Navigation Header */}
        <header className={styles.header}>
          {/* Dekorativer Wordmark */}
          <div className={styles.wordmark}>
            <span className={styles.wordmarkWm}>WM</span>
            <span className={styles.wordmarkYear}>2026</span>
          </div>

          {/* Segmented Control */}
          {!showSettings && (
            <div className={styles.segmented}>
              <button
                className={`${styles.seg}${tab === 'group' ? ` ${styles.segActive}` : ''}`}
                onClick={() => setTab('group')}
                type="button"
              >
                Gruppen
              </button>
              <button
                className={`${styles.seg}${tab === 'knockout' ? ` ${styles.segActive}` : ''}`}
                onClick={() => setTab('knockout')}
                type="button"
              >
                K.o.-Runde
              </button>
            </div>
          )}
          {showSettings && <span className={styles.headerFill} />}

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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.55 3.55l1.41 1.41M13.04 13.04l1.41 1.41M3.55 14.45l1.41-1.41M13.04 4.96l1.41-1.41"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
            <div className={styles.center}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}
          {!showSettings && !loading && !error && tab === 'group' && (
            <GroupScreen
              matches={matches}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              onMatchClick={handleCardClick}
            />
          )}
          {!showSettings && !loading && !error && tab === 'knockout' && (
            <KnockoutScreen matches={matches} onMatchClick={handleCardClick} />
          )}
        </main>
      </div>

      <MatchDetailSheet match={activeMatch} onClose={handleSheetClose} />
    </>
  );
}
