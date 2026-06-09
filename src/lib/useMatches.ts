import { useState, useEffect, useMemo } from 'react';
import { WM_SCHEDULE, WM_GROUPS, type WmStage, type WmGroup } from './schedule';
import { fetchResults, type MatchResult } from './fetchResults';
import { fetchOdds } from './fetchOdds';
import { recalcMatches, type CalcResult, type MarketProbs } from './poisson';
import { NATION_STATS } from './nations';
import { applyCalib, shrinkToMean, HARDCODED_CALIB } from './calibration';

export type MatchEntry = {
  id: string;
  apiId: number;
  group: string;
  stage: WmStage;
  home: string;
  away: string;
  kickoff: string;
  result: CalcResult;
  actual: { g1: number; g2: number } | null;
  finished: boolean;
};

export type MatchesState = {
  loading: boolean;
  error: string | null;
  tab: 'group' | 'knockout';
  selectedGroup: WmGroup;
  matches: MatchEntry[];
  hasMarket: boolean;
  setTab: (t: 'group' | 'knockout') => void;
  setSelectedGroup: (g: WmGroup) => void;
  retry: () => void;
};

export function useMatches(): MatchesState {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [tab, setTab]                       = useState<'group' | 'knockout'>('group');
  const [selectedGroup, setSelectedGroup]   = useState<WmGroup>('A');
  const [resultsMap, setResultsMap]         = useState<Record<number, MatchResult>>({});
  const [oddsMap, setOddsMap]               = useState<Record<string, MarketProbs>>({});
  const [retryCount, setRetryCount]         = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    async function init() {
      try {
        const [results, odds] = await Promise.all([fetchResults(), fetchOdds()]);
        if (cancelled) return;
        setResultsMap(results);
        setOddsMap(odds);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ladefehler');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [retryCount]);

  const matches = useMemo<MatchEntry[]>(() => {
    const inputs = WM_SCHEDULE
      .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
      .map(m => ({
        id: m.id,
        home: m.home,
        away: m.away,
        p: oddsMap[`${m.home}-${m.away}`] ?? null,
        hForm: null,
        aForm: null,
      }));

    const raw = recalcMatches(inputs, NATION_STATS);

    return WM_SCHEDULE
      .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
      .flatMap(m => {
        const rawResult = raw[m.id];
        if (!rawResult) return [];

        // Kalibrierung anwenden
        let { pH, pD, pA } = rawResult;
        let calibrated = false;
        if (HARDCODED_CALIB.n >= 45) {
          ({ pH, pD, pA } = applyCalib(pH, pD, pA, HARDCODED_CALIB));
          calibrated = true;
        } else {
          ({ pH, pD, pA } = shrinkToMean(pH, pD, pA));
        }

        const fp = Math.max(pH, pD, pA);
        const wo = pH >= pD && pH >= pA ? 'H' as const : pD >= pA ? 'D' as const : 'A' as const;
        const result: CalcResult = { ...rawResult, pH, pD, pA, fp, wo, calibrated };

        const actual = resultsMap[m.apiId];
        return [{
          id: m.id,
          apiId: m.apiId,
          group: m.group,
          stage: m.stage,
          home: m.home,
          away: m.away,
          kickoff: m.kickoff,
          result,
          actual: actual ? { g1: actual.g1, g2: actual.g2 } : null,
          finished: actual?.finished ?? false,
        }];
      });
  }, [oddsMap, resultsMap]);

  const hasMarket = matches.some(m => m.result.marketApplied);

  return { loading, error, tab, selectedGroup, matches, hasMarket, setTab, setSelectedGroup, retry: () => setRetryCount(c => c + 1) };
}

export { WM_GROUPS };
