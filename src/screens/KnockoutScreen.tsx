import { useMemo } from 'react';
import type { MatchEntry } from '../lib/useMatches';
import type { WmStage } from '../lib/schedule';
import MatchCard from '../components/MatchCard';
import styles from './KnockoutScreen.module.css';

type Props = {
  matches: MatchEntry[];
};

const STAGE_ORDER: WmStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
];

const STAGE_LABELS: Record<WmStage, string> = {
  GROUP_STAGE:    'Gruppenphase',
  ROUND_OF_32:   'Achtelfinale',
  ROUND_OF_16:   'Viertelfinale',
  QUARTER_FINALS: 'Viertelfinale',
  SEMI_FINALS:   'Halbfinale',
  THIRD_PLACE:   'Spiel um Platz 3',
  FINAL:         'Finale',
};

export default function KnockoutScreen({ matches }: Props) {
  const byStage = useMemo(() => {
    const ko = matches.filter(m => m.stage !== 'GROUP_STAGE');
    const map = new Map<WmStage, MatchEntry[]>();
    for (const m of ko) {
      const list = map.get(m.stage) ?? [];
      list.push(m);
      map.set(m.stage, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    }
    return map;
  }, [matches]);

  const hasAny = STAGE_ORDER.some(s => (byStage.get(s)?.length ?? 0) > 0);

  return (
    <div className={styles.root}>
      {!hasAny && (
        <div className={styles.empty}>
          <p>Die K.o.-Runde beginnt nach der Gruppenphase.</p>
        </div>
      )}
      {STAGE_ORDER.map(stage => {
        const list = byStage.get(stage);
        if (!list || list.length === 0) return null;
        return (
          <section key={stage} className={styles.section}>
            <h2 className={styles.sectionTitle}>{STAGE_LABELS[stage]}</h2>
            <div className={styles.list}>
              {list.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
