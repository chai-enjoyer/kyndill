import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useSocketContext } from '../context/SocketContext';
import { api } from '../lib/api';

export type ActivityType =
  | 'habit_completed'
  | 'purchase'
  | 'friendship'
  | 'level_up'
  | 'gift_sent';

export interface ActivityEntry {
  id: string;
  user_id: string;
  user_display_name: string;
  user_username: string;
  user_avatar_url: string | null;
  type: ActivityType | string;
  metadata: Record<string, unknown>;
  created_at: string;
  is_current_user: boolean;
}

export function useActivityFeed() {
  const { socket } = useSocketContext();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<{ activity: ActivityEntry[] }>('/api/social/activity');
      setActivity(data.activity);
      setError(null);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!socket) return;
    const handleActivityUpdated = () => {
      void refetch();
    };
    socket.on('activity_updated', handleActivityUpdated);
    return () => {
      socket.off('activity_updated', handleActivityUpdated);
    };
  }, [socket, refetch]);

  return { activity, isLoading, error, refetch };
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load activity.';
  }
  return 'Could not load activity.';
}
