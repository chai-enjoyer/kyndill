import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { extractMessage } from './useSocial';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak_current: number;
}

export type LeaderboardScope = 'friends' | 'global';

export function useLeaderboard(scope: LeaderboardScope) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ entries: LeaderboardEntry[] }>(`/api/leaderboard/${scope}`);
      setEntries(data.entries);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not load leaderboard.'));
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { entries, isLoading, error, refetch };
}
