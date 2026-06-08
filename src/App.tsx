import { useState, useCallback } from 'react';
import { useMatches } from './lib/useMatches';
import type { MatchEntry } from './lib/useMatches';
import GroupScreen from './screens/GroupScreen';
import KnockoutScreen from './screens/KnockoutScreen';
import SplashScreen from './components/SplashScreen';
import MatchDetailSheet from './components/MatchDetailSheet';
import styles from './App.module.css';

export default function App() {
  const [splashDone, setSplashDone]       = useState(false);
  const [activeMatch, setActiveMatch]     = useState<MatchEntry | null>(null);
  const state = useMatches();
  const { tab, setTab, selectedGroup, setSelectedGroup, matches, loading, error } = state;

  const handleCardClick = useCallback((m: MatchEntry) => setActiveMatch(m), []);
  const handleSheetClose = useCallback(() => setActiveMatch(null), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className={styles.root}>
        {/* Navigation Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>WM 2026</h1>
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
        </header>

        {/* Inhalt */}
        <main className={styles.main}>
          {loading && (
            <div className={styles.skeletonList} aria-label="Laedt" aria-busy="true">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={styles.skeletonCard}>
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
          {error && !loading && (
            <div className={styles.center}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}
          {!loading && !error && tab === 'group' && (
            <GroupScreen
              matches={matches}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              onMatchClick={handleCardClick}
            />
          )}
          {!loading && !error && tab === 'knockout' && (
            <KnockoutScreen matches={matches} onMatchClick={handleCardClick} />
          )}
        </main>
      </div>

      <MatchDetailSheet match={activeMatch} onClose={handleSheetClose} />
    </>
  );
}
