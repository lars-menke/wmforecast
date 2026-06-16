import type { MatchEntry } from '../lib/useMatches';
import { NATIONS } from '../lib/nations';
import styles from './BracketView.module.css';

type Props = {
  matches: MatchEntry[];
  onMatchClick: (m: MatchEntry) => void;
};

function BracketMatch({ match, onClick }: { match: MatchEntry; onClick: () => void }) {
  const homeCode = match.home;
  const awayCode = match.away;
  const homeNation = NATIONS[homeCode];
  const awayNation = NATIONS[awayCode];
  const isTbd = homeCode === 'TBD' || awayCode === 'TBD';

  const homeWon = match.actual != null && match.finished && match.actual.g1 > match.actual.g2;
  const awayWon = match.actual != null && match.finished && match.actual.g2 > match.actual.g1;

  return (
    <button className={styles.matchBox} onClick={onClick} type="button" disabled={isTbd}>
      <div className={`${styles.team}${homeWon ? ` ${styles.teamWon}` : ''}`}>
        <span className={styles.flag}>{homeNation?.flag ?? '🏳️'}</span>
        <span className={styles.code}>{homeCode === 'TBD' ? '?' : (homeNation?.shortName ?? homeCode)}</span>
        {match.actual && (
          <span className={styles.score} data-numeric>
            {match.finished ? match.actual.g1 : (match.actual.g1Live ?? '')}
          </span>
        )}
      </div>
      <div className={`${styles.team}${awayWon ? ` ${styles.teamWon}` : ''}`}>
        <span className={styles.flag}>{awayNation?.flag ?? '🏳️'}</span>
        <span className={styles.code}>{awayCode === 'TBD' ? '?' : (awayNation?.shortName ?? awayCode)}</span>
        {match.actual && (
          <span className={styles.score} data-numeric>
            {match.finished ? match.actual.g2 : (match.actual.g2Live ?? '')}
          </span>
        )}
      </div>
    </button>
  );
}

function ConnectorPair() {
  return (
    <div className={styles.connectorPair}>
      <div className={styles.connectorTop} />
      <div className={styles.connectorBottom} />
    </div>
  );
}

export default function BracketView({ matches, onMatchClick }: Props) {
  const qf  = matches.filter(m => m.stage === 'QUARTER_FINALS').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const sf  = matches.filter(m => m.stage === 'SEMI_FINALS').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const fin = matches.filter(m => m.stage === 'FINAL');
  const trd = matches.filter(m => m.stage === 'THIRD_PLACE');

  const hasQF = qf.length > 0;
  const hasSF = sf.length > 0;
  const hasFin = fin.length > 0;

  if (!hasQF && !hasSF && !hasFin) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>K.o.-Bracket wird nach dem Achtelfinale verfugbar.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.bracket}>
        {/* QF column */}
        {hasQF && (
          <>
            <div className={styles.round}>
              <div className={styles.roundLabel}>Viertelfinale</div>
              <div className={styles.roundPair}>
                {qf[0] && <BracketMatch match={qf[0]} onClick={() => onMatchClick(qf[0])} />}
                {qf[1] && <BracketMatch match={qf[1]} onClick={() => onMatchClick(qf[1])} />}
              </div>
              <div className={styles.roundPairGap} />
              <div className={styles.roundPair}>
                {qf[2] && <BracketMatch match={qf[2]} onClick={() => onMatchClick(qf[2])} />}
                {qf[3] && <BracketMatch match={qf[3]} onClick={() => onMatchClick(qf[3])} />}
              </div>
            </div>
            <div className={styles.connectorCol}>
              <ConnectorPair />
              <div className={styles.connectorMid} />
              <ConnectorPair />
            </div>
          </>
        )}

        {/* SF column */}
        {hasSF && (
          <>
            <div className={styles.round}>
              <div className={styles.roundLabel}>Halbfinale</div>
              <div className={styles.sfSpacer} />
              {sf[0] && <BracketMatch match={sf[0]} onClick={() => onMatchClick(sf[0])} />}
              <div className={styles.sfGap} />
              {sf[1] && <BracketMatch match={sf[1]} onClick={() => onMatchClick(sf[1])} />}
              <div className={styles.sfSpacer} />
            </div>
            <div className={styles.connectorCol}>
              <ConnectorPair />
            </div>
          </>
        )}

        {/* Final column */}
        {hasFin && (
          <div className={styles.round}>
            <div className={styles.roundLabel}>Finale</div>
            <div className={styles.finalSpacer} />
            {fin[0] && <BracketMatch match={fin[0]} onClick={() => onMatchClick(fin[0])} />}
            <div className={styles.finalSpacer} />
          </div>
        )}
      </div>

      {/* 3rd place */}
      {trd.length > 0 && (
        <div className={styles.thirdSection}>
          <div className={styles.thirdLabel}>Spiel um Platz 3</div>
          {trd[0] && <BracketMatch match={trd[0]} onClick={() => onMatchClick(trd[0])} />}
        </div>
      )}
    </div>
  );
}
