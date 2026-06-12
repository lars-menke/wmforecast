import { useState, useEffect, useMemo, useRef } from 'react';
import { WM_SCHEDULE, WM_GROUPS, type WmStage, type WmGroup } from './schedule';
import { fetchResults, type MatchResult, type GoalEvent } from './fetchResults';
import { fetchOdds } from './fetchOdds';
import { recalcMatches, deriveNaturalTipp, type CalcResult, type MarketProbs } from './poisson';
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
  actual: { g1: number; g2: number; g1Live?: number; g2Live?: number } | null;
  finished: boolean;
  live: boolean;
  goals: GoalEvent[];
  espnId: string | undefined;
};

export type MatchesState = {
  loading: boolean;
  error: string | null;
  tab: 'group' | 'knockout';
  selectedGroup: WmGroup;
  matches: MatchEntry[];
  hasMarket: boolean;
  liveCount: number;
  resultsMap: Record<string, MatchResult>;
  setTab: (t: 'group' | 'knockout') => void;
  setSelectedGroup: (g: WmGroup) => void;
  retry: () => void;
};

const LIVE_POLL_INTERVAL = 45 * 1000; // 45 seconds

export function useMatches(): MatchesState {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [tab, setTab]                       = useState<'group' | 'knockout'>('group');
  const [selectedGroup, setSelectedGroup]   = useState<WmGroup>('A');
  const [resultsMap, setResultsMap]         = useState<Record<string, MatchResult>>({});
  const [oddsMap, setOddsMap]               = useState<Record<string, MarketProbs>>({});
  const [retryCount, setRetryCount]         = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    async function init() {
      try {
        const [results, odds] = await Promise.all([
          fetchResults(),
          fetchOdds(),
        ]);
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

  // Live polling: check if any matches are currently live
  const liveCount = useMemo(() => {
    const now = Date.now();
    return WM_SCHEDULE.filter(m => {
      const kick = new Date(m.kickoff).getTime();
      return kick <= now && now <= kick + 120 * 60 * 1000;
    }).length;
  }, []);

  // Also count matches in resultsMap that are live
  const liveCountFromResults = useMemo(
    () => Object.values(resultsMap).filter(r => r.live).length,
    [resultsMap],
  );

  const effectiveLiveCount = Math.max(liveCount, liveCountFromResults);

  useEffect(() => {
    if (effectiveLiveCount <= 0) return;
    intervalRef.current = setInterval(async () => {
      try {
        const results = await fetchResults();
        setResultsMap(results);
      } catch { /* ignore poll errors */ }
    }, LIVE_POLL_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [effectiveLiveCount]);

  const matches = useMemo<MatchEntry[]>(() => {
    const inputs = WM_SCHEDULE
      .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
      .map(m => ({
        id: m.id,
        home: m.home,
        away: m.away,
        p: (() => {
          const fwd = oddsMap[`${m.home}-${m.away}`];
          if (fwd) return fwd;
          const rev = oddsMap[`${m.away}-${m.home}`];
          if (rev) return { h: rev.a, d: rev.d, a: rev.h };
          return null;
        })(),
        hForm: null,
        aForm: null,
      }));

    const raw = recalcMatches(inputs, NATION_STATS);

    return WM_SCHEDULE
      .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
      .flatMap(m => {
        const rawResult = raw[m.id];
        if (!rawResult) return [];

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
        const naturalTipp = deriveNaturalTipp(rawResult.srt, wo);
        const result: CalcResult = { ...rawResult, pH, pD, pA, fp, wo, naturalTipp, calibrated };

        // Look up by "HOME-AWAY" or reversed
        const actual = resultsMap[`${m.home}-${m.away}`]
          ?? resultsMap[`${m.away}-${m.home}`];

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
          live: actual?.live ?? false,
          goals: actual?.goals ?? [],
          espnId: actual?.espnId,
        }];
      });
  }, [oddsMap, resultsMap]);

  const hasMarket = matches.some(m => m.result.marketApplied);

  return {
    loading, error, tab, selectedGroup, matches, hasMarket,
    liveCount: effectiveLiveCount, resultsMap,
    setTab, setSelectedGroup, retry: () => setRetryCount(c => c + 1),
  };
}

export { WM_GROUPS };
