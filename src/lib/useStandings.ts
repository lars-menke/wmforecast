import { useState, useEffect } from 'react';
import { fetchGroups, computeStandings, type GroupStandings } from './fetchGroups';
import type { MatchResult } from './fetchResults';

export type StandingsState = {
  standings: GroupStandings;
  loading: boolean;
};

export function useStandings(resultsMap: Record<string, MatchResult>): StandingsState {
  const [standings, setStandings] = useState<GroupStandings>({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const remote = await fetchGroups();
        if (cancelled) return;
        if (Object.keys(remote).length > 0) {
          setStandings(remote);
        } else {
          // Fallback: compute from results
          setStandings(computeStandings(resultsMap));
        }
      } catch {
        if (!cancelled) setStandings(computeStandings(resultsMap));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsMap]);

  return { standings, loading };
}
