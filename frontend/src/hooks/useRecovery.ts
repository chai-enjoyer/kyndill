import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { extractMessage } from './useSocial';
import type { HabitCategory } from './useHabits';

export interface RecoveryPrompt {
  missed_on: string;
  missed_habits: Array<{
    id: string;
    name: string;
    category: HabitCategory;
    completion_count: number;
    target_count: number;
  }>;
}

export interface RecoveryReflectionInput {
  missed_on: string;
  habit_id?: string;
  mood?: string;
  note?: string;
  skipped?: boolean;
}

export function useRecoveryPrompt() {
  const [prompt, setPrompt] = useState<RecoveryPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ prompt: RecoveryPrompt | null }>('/api/recovery/prompt');
      setPrompt(data.prompt);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not load recovery prompt.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(async (input: RecoveryReflectionInput) => {
    await api.post('/api/recovery/reflection', input);
    setPrompt(null);
  }, []);

  const dismiss = useCallback(() => {
    setPrompt(null);
  }, []);

  return { prompt, isLoading, error, refetch, save, dismiss };
}
