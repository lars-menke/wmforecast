import { useState, useEffect, useMemo, useRef } from 'react';
import { WM_SCHEDULE, WM_GROUPS, type WmStage, type WmGroup } from './schedule';
import { fetchResults, type MatchResult, type GoalEvent } from './fetchResults';
import { fetchOdds } from './fetchOdds';
import { recalcMatches, type CalcResult, type MarketProbs } from './poisson';
import { NATION_STATS } from './nations';
import { HARDCODED_CALIB, updateCalib, type CalibSample } from './calibration';

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
  venue?: string;
};

export type MatchesState = {
  loading: boolean;
  error: string | null;
  tab: 'today' | 'group' | 'knockout';
  selectedGroup: WmGroup;
  matches: MatchEntry[];
  hasMarket: boolean;
  liveCount: number;
  resultsMap: Record<string, MatchResult>;
  setTab: (t: 'today' | 'group' | 'knockout') => void;
  setSelectedGroup: (g: WmGroup) => void;
  retry: () => void;
};

const LIVE_POLL_INTERVAL = 45 * 1000; // 45 seconds

export function useMatches(): MatchesState {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [tab, setTab]                       = useState<'today' | 'group' | 'knockout'>('today');
  const [selectedGroup, setSelectedGroup]   = useState<WmGroup>('A');
  const [resultsMap, setResultsMap]         = useState<Record<string, MatchResult>>({});
  const [venueMap, setVenueMap]             = useState<Record<string, string>>({});
  const [kickoffMap, setKickoffMap]         = useState<Record<string, string>>({});
  const [oddsMap, setOddsMap]               = useState<Record<string, MarketProbs>>({});
  const [retryCount, setRetryCount]         = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    async function init() {
      try {
        const [{ results, venues, kickoffs }, odds] = await Promise.all([
          fetchResults(),
          fetchOdds(),
        ]);
        if (cancelled) return;
        setResultsMap(results);
        setVenueMap(venues);
        setKickoffMap(kickoffs);
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

  // Live count: only trust the API (resultsMap), not schedule time estimates
  const effectiveLiveCount = useMemo(
    () => Object.values(resultsMap).filter(r => r.live).length,
    [resultsMap],
  );

  useEffect(() => {
    if (effectiveLiveCount <= 0) return;
    intervalRef.current = setInterval(async () => {
      try {
        const { results, venues, kickoffs } = await fetchResults();
        setResultsMap(results);
        setVenueMap(venues);
        setKickoffMap(kickoffs);
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
      }));

    // Live-Kalibrierung: rohe Probs für gespielte Spiele sammeln,
    // dann HARDCODED_CALIB mit echten Ergebnissen updaten.
    const rawCalc = recalcMatches(inputs, NATION_STATS, null);
    const samples: CalibSample[] = [];
    for (const m of WM_SCHEDULE) {
      if (m.home === 'TBD' || m.away === 'TBD') continue;
      const res = resultsMap[`${m.home}-${m.away}`] ?? resultsMap[`${m.away}-${m.home}`];
      if (!res?.finished) continue;
      const raw = rawCalc[m.id];
      if (!raw) continue;
      const homeIsHome = resultsMap[`${m.home}-${m.away}`] != null;
      const actual = homeIsHome
        ? (res.g1 > res.g2 ? 'H' : res.g1 < res.g2 ? 'A' : 'D')
        : (res.g2 > res.g1 ? 'H' : res.g2 < res.g1 ? 'A' : 'D');
      samples.push({ pH: raw.pH, pD: raw.pD, pA: raw.pA, actual: actual as 'H'|'D'|'A' });
    }
    const liveCalib = updateCalib(HARDCODED_CALIB, samples);
    const calc = recalcMatches(inputs, NATION_STATS, liveCalib);

    return WM_SCHEDULE
      .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
      .flatMap(m => {
        const result = calc[m.id];
        if (!result) return [];

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
          kickoff: kickoffMap[`${m.home}-${m.away}`]
            ?? kickoffMap[`${m.away}-${m.home}`]
            ?? m.kickoff,
          result,
          actual: actual ? { g1: actual.g1, g2: actual.g2, g1Live: actual.g1Live, g2Live: actual.g2Live } : null,
          finished: actual?.finished ?? false,
          live: actual?.live ?? false,
          goals: actual?.goals ?? [],
          espnId: actual?.espnId,
          venue: m.venue
            ?? venueMap[`${m.home}-${m.away}`]
            ?? venueMap[`${m.away}-${m.home}`],
        }];
      });
  }, [oddsMap, resultsMap, venueMap, kickoffMap]);

  const hasMarket = matches.some(m => m.result.marketApplied);

  return {
    loading, error, tab, selectedGroup, matches, hasMarket,
    liveCount: effectiveLiveCount, resultsMap,
    setTab, setSelectedGroup, retry: () => setRetryCount(c => c + 1),
  };
}

export { WM_GROUPS };
