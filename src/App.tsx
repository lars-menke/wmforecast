import { useMatches } from './lib/useMatches';
import GroupScreen from './screens/GroupScreen';
import KnockoutScreen from './screens/KnockoutScreen';
import styles from './App.module.css';

export default function App() {
  const state = useMatches();
  const { tab, setTab, selectedGroup, setSelectedGroup, matches, loading, error } = state;

  return (
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
          <div className={styles.center}>
            <span className={styles.spinner} aria-label="Laedt" />
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
          />
        )}
        {!loading && !error && tab === 'knockout' && (
          <KnockoutScreen matches={matches} />
        )}
      </main>

    </div>
  );
}
