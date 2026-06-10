import { NATIONS } from '../lib/nations';
import type { StandingRow } from '../lib/fetchGroups';
import styles from './StandingsTable.module.css';

type Props = {
  rows: StandingRow[];
  group: string;
};

export default function StandingsTable({ rows, group }: Props) {
  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Spiele gespielt.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Gruppe {group}</div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headRow}>
            <th className={styles.thRank}>#</th>
            <th className={styles.thTeam}>Team</th>
            <th className={styles.thNum}>Sp</th>
            <th className={styles.thNum}>S</th>
            <th className={styles.thNum}>U</th>
            <th className={styles.thNum}>N</th>
            <th className={styles.thGoals}>T</th>
            <th className={styles.thNum}>TD</th>
            <th className={`${styles.thNum} ${styles.thPts}`}>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const nation = NATIONS[row.code];
            const rowClass = i < 2
              ? styles.rowAdvance
              : i === 2
                ? styles.rowThird
                : styles.row;
            return (
              <tr key={row.code} className={rowClass}>
                <td className={styles.tdRank}>{i + 1}</td>
                <td className={styles.tdTeam}>
                  <span className={styles.flag} aria-hidden="true">
                    {nation?.flag ?? ''}
                  </span>
                  <span className={styles.teamName}>
                    {nation?.shortName ?? row.code}
                  </span>
                </td>
                <td className={styles.tdNum} data-numeric>{row.played}</td>
                <td className={styles.tdNum} data-numeric>{row.won}</td>
                <td className={styles.tdNum} data-numeric>{row.drawn}</td>
                <td className={styles.tdNum} data-numeric>{row.lost}</td>
                <td className={styles.tdGoals} data-numeric>
                  {row.gf}:{row.ga}
                </td>
                <td className={styles.tdNum} data-numeric>
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className={`${styles.tdNum} ${styles.tdPts}`} data-numeric>
                  {row.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={styles.legend}>
        <span className={styles.legendGreen} />
        <span className={styles.legendText}>Direkt qualifiziert (Pl. 1+2)</span>
        <span className={styles.legendBlue} />
        <span className={styles.legendText}>Evtl. qualifiziert (Pl. 3)</span>
      </div>
    </div>
  );
}
