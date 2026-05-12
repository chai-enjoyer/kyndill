import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export type HabitCategory = 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness';
export type HabitFrequency = 'daily' | 'weekly';

export interface HabitWithStatus {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  frequency: HabitFrequency;
  days_of_week: number[] | null;
  completion_start_time: string | null;
  completion_end_time: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  completed_today: boolean;
  current_streak: number;
}

export interface DroppedItem {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
}

export interface CompleteResult {
  xp_earned: number;
  coins_earned: number;
  new_streak: number;
  longest_streak: number;
  item_dropped: DroppedItem | null;
  leveled_up: boolean;
  new_level: number;
  pet_health: number;
  pet_total_habits_completed: number;
  pet_is_fainted: boolean;
}

export interface HabitFormInput {
  name: string;
  description?: string | null;
  category: HabitCategory;
  frequency: HabitFrequency;
  days_of_week?: number[];
  completion_start_time?: string | null;
  completion_end_time?: string | null;
}

interface UseHabitsOptions {
  scope?: 'today' | 'all';
}

export function useHabits(options: UseHabitsOptions = {}) {
  const scope = options.scope ?? 'today';
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ habits: HabitWithStatus[] }>('/api/habits', {
        params: scope === 'all' ? { scope: 'all' } : undefined,
      });
      setHabits(data.habits);
      setError(null);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Optimistic complete: bumps completed_today + per-habit streak immediately,
  // rolls back on failure. The functional setState captures the previous list
  // so the callback identity stays stable across renders.
  const complete = useCallback(
    async (habitId: string): Promise<CompleteResult> => {
      let snapshot: HabitWithStatus[] = [];
      setHabits((prev) => {
        snapshot = prev;
        return prev.map((h) =>
          h.id === habitId
            ? { ...h, completed_today: true, current_streak: h.current_streak + 1 }
            : h,
        );
      });
      try {
        const { data } = await api.post<CompleteResult>(`/api/habits/${habitId}/complete`);
        return data;
      } catch (err) {
        setHabits(snapshot);
        throw err;
      }
    },
    [],
  );

  const create = useCallback(
    async (input: HabitFormInput): Promise<void> => {
      await api.post('/api/habits', normalizeHabitInput(input));
      await refetch();
    },
    [refetch],
  );

  const update = useCallback(
    async (habitId: string, input: Partial<HabitFormInput> & { is_active?: boolean }): Promise<void> => {
      await api.put(`/api/habits/${habitId}`, normalizeHabitInput(input));
      await refetch();
    },
    [refetch],
  );

  const archive = useCallback(
    async (habitId: string): Promise<void> => {
      await api.delete(`/api/habits/${habitId}`);
      await refetch();
    },
    [refetch],
  );

  const reorder = useCallback(async (orderedIds: string[]): Promise<void> => {
    const snapshot = habits;
    const byId = new Map(habits.map((habit) => [habit.id, habit]));
    const next = orderedIds
      .map((id, index) => {
        const habit = byId.get(id);
        return habit ? { ...habit, sort_order: index } : null;
      })
      .filter((habit): habit is HabitWithStatus => habit !== null);
    setHabits(next);
    try {
      await api.post('/api/habits/reorder', orderedIds.map((id, index) => ({ id, sort_order: index })));
    } catch (err) {
      setHabits(snapshot);
      throw err;
    }
  }, [habits]);

  return { habits, isLoading, error, refetch, complete, create, update, archive, reorder };
}

function normalizeHabitInput(input: Partial<HabitFormInput> & { is_active?: boolean }) {
  const next: Record<string, unknown> = { ...input };
  if ('description' in input) {
    next.description = input.description?.trim() ? input.description.trim() : null;
  }
  if ('days_of_week' in input || input.frequency !== undefined) {
    next.days_of_week = input.frequency === 'weekly' ? input.days_of_week : undefined;
  }
  if ('completion_start_time' in input) {
    next.completion_start_time = input.completion_start_time || null;
  }
  if ('completion_end_time' in input) {
    next.completion_end_time = input.completion_end_time || null;
  }
  return next;
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load habits.';
  }
  return 'Could not load habits.';
}
