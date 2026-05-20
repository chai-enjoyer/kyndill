import { useCallback, useEffect, useRef, useState } from 'react';
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

// Once the user closes/skips today, don't ask again until tomorrow — even if
// other missed days exist. Keyed by local date so it auto-expires overnight.
const SUPPRESS_KEY = 'kyndill_recovery_suppress_date';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isSuppressedToday(): boolean {
  try {
    return window.localStorage.getItem(SUPPRESS_KEY) === todayKey();
  } catch {
    return false;
  }
}

function suppressForToday(): void {
  try {
    window.localStorage.setItem(SUPPRESS_KEY, todayKey());
  } catch {
    // Storage unavailable (private mode / quota). In-memory suppression below
    // still covers the current session.
  }
}

export function useRecoveryPrompt() {
  const [prompt, setPrompt] = useState<RecoveryPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<RecoveryPrompt | null>(null);
  const suppressedRef = useRef<boolean>(isSuppressedToday());
  promptRef.current = prompt;

  const refetch = useCallback(async () => {
    if (suppressedRef.current) {
      setPrompt(null);
      setIsLoading(false);
      return;
    }
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
    // Whether they reflected or skipped, they've engaged — give them peace
    // for the rest of the day even if other missed days remain.
    suppressForToday();
    suppressedRef.current = true;
    setPrompt(null);
  }, []);

  // Closing via X / backdrop / ESC: respect "not now" by suppressing for the
  // day. We still record a skip on the server for the specific missed_on so
  // analytics and the 7-day window stay accurate, but the user won't be
  // re-prompted until tomorrow.
  const dismiss = useCallback(() => {
    const current = promptRef.current;
    suppressForToday();
    suppressedRef.current = true;
    setPrompt(null);
    if (!current) return;
    void api
      .post('/api/recovery/reflection', {
        missed_on: current.missed_on,
        skipped: true,
      })
      .catch(() => {
        // Silent failure is fine — suppression is local, so the user is not
        // re-prompted today regardless.
      });
  }, []);

  return { prompt, isLoading, error, refetch, save, dismiss };
}
