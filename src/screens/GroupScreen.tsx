import React, { useState, useMemo } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import { WM_SCHEDULE, WM_GROUPS, type WmGroup } from '../lib/schedule';
import type { GroupStandings } from '../lib/fetchGroups';
import { NATIONS } from '../lib/nations';
import MatchCard from '../components/MatchCard';
import StandingsTable from '../components/StandingsTable';
import styles from './GroupScreen.module.css';

type Props = {
  matches: MatchEntry[];
  selectedGroup: WmGroup;
  onSelectGroup: (g: WmGroup) => void;
  onMatchClick: (m: MatchEntry) => void;
  standings: GroupStandings;
  standingsLoading: boolean;
};

export default function GroupScreen({
  matches,
  selectedGroup,
  onSelectGroup,
  onMatchClick,
  standings,
  standingsLoading,
}: Props) {
  const [groupTab, setGroupTab] = useState<'matches' | 'table'>('matches');

  const groupMatches = useMemo(
    () => matches
      .filter(m => m.stage === 'GROUP_STAGE' && m.group === selectedGroup)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches, selectedGroup],
  );

  const groupTeams = useMemo(
    () => [...new Set(
      WM_SCHEDULE
        .filter(m => m.group === selectedGroup && m.stage === 'GROUP_STAGE')
        .flatMap(m => [m.home, m.away])
    )],
    [selectedGroup],
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

      {/* Secondary segmented control: Spiele | Tabelle */}
      <div className={styles.subTabBar}>
        <div className={styles.subSeg}>
          <button
            className={`${styles.subSegBtn}${groupTab === 'matches' ? ` ${styles.subSegActive}` : ''}`}
            onClick={() => setGroupTab('matches')}
            type="button"
          >
            Spiele
          </button>
          <button
            className={`${styles.subSegBtn}${groupTab === 'table' ? ` ${styles.subSegActive}` : ''}`}
            onClick={() => setGroupTab('table')}
            type="button"
          >
            Tabelle
          </button>
        </div>
      </div>

      {/* Inhaltsbereich */}
      <div className={styles.list}>
        {groupTab === 'matches' ? (
          <>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitleBlock}>
                <h2 className={styles.groupTitle}>Gruppe {selectedGroup}</h2>
                <div className={styles.groupTeams}>
                  {groupTeams.map(code => (
                    <span key={code} className={styles.groupTeam}>
                      <span aria-hidden="true">{NATIONS[code]?.flag ?? ''}</span>
                      <span>{NATIONS[code]?.shortName ?? code}</span>
                    </span>
                  ))}
                </div>
              </div>
              <span className={styles.groupCount}>{groupMatches.length} Spiele</span>
            </div>
            {groupMatches.length === 0 && (
              <p className={styles.empty}>Keine Spiele gefunden.</p>
            )}
            {groupMatches.map((m, i) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={() => onMatchClick(m)}
                style={{ '--card-index': i } as React.CSSProperties}
              />
            ))}
          </>
        ) : (
          standingsLoading ? (
            <div className={styles.empty}>Tabelle wird geladen...</div>
          ) : (
            <StandingsTable
              rows={standings[selectedGroup] ?? []}
              group={selectedGroup}
            />
          )
        )}
      </div>
    </div>
  );
}
