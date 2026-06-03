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

// закрыл/пропустил сегодня - до завтра не спрашиваем. Ключ по локальной дате.
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
    // localStorage недоступен (инкогнито/квота) - в памяти всё равно подавим на сессию
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
    // ответил или пропустил - всё равно не дёргаем до завтра
    suppressForToday();
    suppressedRef.current = true;
    setPrompt(null);
  }, []);

  // закрытие по X/бэкдропу/ESC = "не сейчас": подавляем на день, но на сервер
  // всё равно шлём skip для конкретного missed_on (чтобы 7-дневное окно было точным)
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
        // тихо глотаем - подавление локальное, сегодня всё равно не спросим
      });
  }, []);

  return { prompt, isLoading, error, refetch, save, dismiss };
}
