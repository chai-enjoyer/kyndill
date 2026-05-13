import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { extractMessage } from './useSocial';

export type ProgressCategory = 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness';

export interface ProgressSummary {
  generated_at: string;
  overview: {
    total_habits_created: number;
    active_habits: number;
    total_check_ins: number;
    total_completed_days: number;
    active_days: number;
    current_streak: number;
    longest_streak: number;
    focus_minutes: number;
    focus_sessions: number;
    friends: number;
    gifts_sent: number;
    gifts_received: number;
    feedback_entries: number;
    recovery_reflections: number;
    weekly_completion_rate: number;
  };
  weekly: Array<{
    date: string;
    label: string;
    completed: number;
    target: number;
    rate: number | null;
  }>;
  most_consistent_habit: {
    id: string;
    name: string;
    category: ProgressCategory;
    completed_days: number;
    expected_days: number;
    rate: number;
  } | null;
  category_breakdown: Array<{
    category: ProgressCategory;
    completions: number;
    check_ins: number;
  }>;
  social: {
    friends: number;
    gifts_sent: number;
    gifts_received: number;
  };
}

export function useProgress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ProgressSummary>('/api/progress/summary');
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not load progress.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, isLoading, error, refetch };
}
