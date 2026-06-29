import { useState, useEffect, useMemo, useRef } from 'react';
import { WM_SCHEDULE, WM_GROUPS, type WmStage, type WmGroup, type WmMatch } from './schedule';
import { fetchResults, type MatchResult, type GoalEvent } from './fetchResults';
import { fetchOdds } from './fetchOdds';
import { recalcMatches, type CalcResult, type MarketProbs } from './poisson';
import { NATION_STATS } from './nations';
import { HARDCODED_CALIB, updateCalib, type CalibSample } from './calibration';
import { logPreMatch, logPostMatch } from './learnLog';

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

// K.o.-Runden in chronologischer Reihenfolge mit Anzahl Spiele pro Runde
const KO_ROUND_CAPS: Array<[WmStage, number]> = [
  ['ROUND_OF_32', 16],
  ['ROUND_OF_16', 8],
  ['QUARTER_FINALS', 4],
  ['SEMI_FINALS', 2],
  ['THIRD_PLACE', 1],
  ['FINAL', 1],
];

// Frühester Kickoff der K.o.-Phase (UTC) — alles davor ist Gruppenphase
const KO_START_ISO = '2026-06-28T10:00:00Z';

/**
 * Löst die TBD-Slots der K.o.-Phase auf: Echte Paarungen kommen aus den
 * ESPN-Kickoff-Daten (alle angesetzten Spiele). Alles, was keine bekannte
 * Gruppenpaarung ist und nach Gruppenende stattfindet, wird chronologisch
 * sortiert und runden­weise auf die statischen Slots (R32-M1, R16-M1, …)
 * verteilt. So bleiben Slot-IDs erhalten (Turnierbaum) und die Spiele
 * erscheinen wieder in Tagesübersicht und Liste.
 */
function resolveSchedule(kickoffMap: Record<string, string>): WmMatch[] {
  // Bekannte Gruppenpaarungen (beide Richtungen)
  const groupPairs = new Set<string>();
  for (const m of WM_SCHEDULE) {
    if (m.stage === 'GROUP_STAGE') {
      groupPairs.add(`${m.home}-${m.away}`);
      groupPairs.add(`${m.away}-${m.home}`);
    }
  }

  // K.o.-Begegnungen aus den ESPN-Kickoffs herausfiltern
  const koFixtures = Object.entries(kickoffMap)
    .filter(([key]) => !groupPairs.has(key))
    .map(([key, iso]) => {
      const dash = key.indexOf('-');
      return { home: key.slice(0, dash), away: key.slice(dash + 1), kickoff: iso };
    })
    .filter(f => f.kickoff >= KO_START_ISO)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  if (koFixtures.length === 0) return WM_SCHEDULE;

  // Statische K.o.-Slots pro Runde (chronologisch)
  const slotsByStage = new Map<WmStage, WmMatch[]>();
  for (const m of WM_SCHEDULE) {
    if (m.stage === 'GROUP_STAGE') continue;
    const arr = slotsByStage.get(m.stage) ?? [];
    arr.push(m);
    slotsByStage.set(m.stage, arr);
  }
  for (const arr of slotsByStage.values()) {
    arr.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }

  // Runden­weise zuordnen — jede Runde verbraucht genau cap Indizes,
  // damit die Ausrichtung auch bei noch unvollständigen Runden stimmt.
  const resolved = new Map<string, { home: string; away: string }>();
  let idx = 0;
  for (const [stage, cap] of KO_ROUND_CAPS) {
    const slots = slotsByStage.get(stage) ?? [];
    for (let i = 0; i < cap; i++) {
      const fixture = koFixtures[idx];
      const slot = slots[i];
      if (fixture && slot) resolved.set(slot.id, { home: fixture.home, away: fixture.away });
      idx++;
    }
  }

  if (resolved.size === 0) return WM_SCHEDULE;
  return WM_SCHEDULE.map(m => {
    const r = resolved.get(m.id);
    return r ? { ...m, home: r.home, away: r.away } : m;
  });
}

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
        const { results, venues, kickoffs } = await fetchResults();
        const liveOrFinishedKeys = new Set<string>(
          WM_SCHEDULE
            .filter(m => results[`${m.home}-${m.away}`] != null || results[`${m.away}-${m.home}`] != null)
            .map(m => {
              if (results[`${m.home}-${m.away}`] != null) return `${m.home}-${m.away}`;
              return `${m.away}-${m.home}`;
            }),
        );
        const odds = await fetchOdds(liveOrFinishedKeys);
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
    const schedule = resolveSchedule(kickoffMap);
    const inputs = schedule
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
        knockout: m.stage !== 'GROUP_STAGE',
      }));

    // Live-Kalibrierung: rohe Probs für gespielte Spiele sammeln,
    // dann HARDCODED_CALIB mit echten Ergebnissen updaten.
    const rawCalc = recalcMatches(inputs, NATION_STATS, null);
    const samples: CalibSample[] = [];
    for (const m of schedule) {
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

    // Learning log: record pre-match and post-match data
    for (const m of schedule) {
      if (m.home === 'TBD' || m.away === 'TBD') continue;
      const matchId = `${m.home}-${m.away}`;
      const oddsEntry = oddsMap[matchId] ?? oddsMap[`${m.away}-${m.home}`];
      const calcEntry = calc[m.id];
      if (!calcEntry) continue;

      if (oddsEntry) {
        // Normalize odds direction to HOME-AWAY
        const normalizedOdds = oddsMap[matchId]
          ? oddsEntry
          : { h: oddsEntry.a, d: oddsEntry.d, a: oddsEntry.h };
        logPreMatch({
          matchId,
          kickoff: m.kickoff,
          lH_model: calcEntry.lH_model,
          lA_model: calcEntry.lA_model,
          lH_blend: calcEntry.lH,
          lA_blend: calcEntry.lA,
          oddsH: normalizedOdds.h / 100,
          oddsD: normalizedOdds.d / 100,
          oddsA: normalizedOdds.a / 100,
        });
      }

      const res = resultsMap[matchId] ?? resultsMap[`${m.away}-${m.home}`];
      if (res?.finished) {
        const homeIsHome = resultsMap[matchId] != null;
        const actualOutcome: 'H' | 'D' | 'A' = homeIsHome
          ? (res.g1 > res.g2 ? 'H' : res.g1 < res.g2 ? 'A' : 'D')
          : (res.g2 > res.g1 ? 'H' : res.g2 < res.g1 ? 'A' : 'D');
        logPostMatch(matchId, actualOutcome);
      }
    }

    return schedule
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
