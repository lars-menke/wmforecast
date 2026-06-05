import { useState } from 'react';
import styles from './App.module.css';

type Tab = 'group' | 'knockout';

export default function App() {
  const [tab, setTab] = useState<Tab>('group');

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        {tab === 'group' && (
          <div className={styles.placeholder}>
            <p>Gruppenphase kommt bald</p>
          </div>
        )}
        {tab === 'knockout' && (
          <div className={styles.placeholder}>
            <p>K.o.-Runde kommt bald</p>
          </div>
        )}
      </main>

      <nav className={styles.tabbar}>
        <button
          className={`${styles.tab}${tab === 'group' ? ` ${styles.tabActive}` : ''}`}
          onClick={() => setTab('group')}
        >
          <span className={styles.tabIcon}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="currentColor" opacity={tab === 'group' ? 1 : 0.4} />
              <rect x="12" y="2" width="8" height="8" rx="2" fill="currentColor" opacity={tab === 'group' ? 1 : 0.4} />
              <rect x="2" y="12" width="8" height="8" rx="2" fill="currentColor" opacity={tab === 'group' ? 1 : 0.4} />
              <rect x="12" y="12" width="8" height="8" rx="2" fill="currentColor" opacity={tab === 'group' ? 1 : 0.4} />
            </svg>
          </span>
          <span className={styles.tabLabel}>Gruppen</span>
        </button>

        <button
          className={`${styles.tab}${tab === 'knockout' ? ` ${styles.tabActive}` : ''}`}
          onClick={() => setTab('knockout')}
        >
          <span className={styles.tabIcon}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M2 11h5M7 11l4-4M7 11l4 4M11 7h4M11 15h4M15 7l4 4M15 15l4-4M15 11h2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={tab === 'knockout' ? 1 : 0.4}
              />
            </svg>
          </span>
          <span className={styles.tabLabel}>K.o.-Runde</span>
        </button>
      </nav>
    </div>
  );
}
