import React, { useMemo } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { WM_GROUPS, type WmGroup } from '../lib/schedule';
import MatchCard from '../components/MatchCard';
import styles from './GroupScreen.module.css';

type Props = {
  matches: MatchEntry[];
  selectedGroup: WmGroup;
  onSelectGroup: (g: WmGroup) => void;
  onMatchClick: (m: MatchEntry) => void;
};

export default function GroupScreen({ matches, selectedGroup, onSelectGroup, onMatchClick }: Props) {
  const groupMatches = useMemo(
    () => matches
      .filter(m => m.stage === 'GROUP_STAGE' && m.group === selectedGroup)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches, selectedGroup],
  );

  return (
    <div className={styles.root}>
      {/* Gruppen-Picker */}
      <div className={styles.pickerScroll}>
        <div className={styles.picker}>
          {WM_GROUPS.map(g => (
            <button
              key={g}
              className={`${styles.pill}${g === selectedGroup ? ` ${styles.pillActive}` : ''}`}
              onClick={() => onSelectGroup(g)}
              type="button"
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Spiele */}
      <div className={styles.list}>
        <h2 className={styles.groupTitle}>Gruppe {selectedGroup}</h2>
        {groupMatches.length === 0 && (
          <p className={styles.empty}>Keine Spiele gefunden.</p>
        )}
        {groupMatches.map((m, i) => (
          <MatchCard key={m.id} match={m} onClick={() => onMatchClick(m)} style={{ '--card-index': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
