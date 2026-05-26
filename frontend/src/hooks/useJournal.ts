import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export type JournalEntryKind =
  | 'habit_feedback'
  | 'recovery_reflection'
  | 'recovery_skipped'
  | 'mood_ping';

export type JournalEntrySource = 'feedback' | 'mood_ping';

export interface JournalEntry {
  source: JournalEntrySource;
  id: string;
  kind: JournalEntryKind;
  created_at: string;
  note: string | null;
  mood: string | null;
  rating: number | null;
  missed_on: string | null;
  week_of: string | null;
  habit: { id: string; name: string; category: string } | null;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ entries: JournalEntry[] }>('/api/journal/entries');
      setEntries(data.entries);
      // Page-full → assume more available; partial → reached the tail.
      setHasMore(data.entries.length >= 30);
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

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || entries.length === 0) return;
    const last = entries[entries.length - 1];
    setIsLoadingMore(true);
    try {
      const { data } = await api.get<{ entries: JournalEntry[] }>('/api/journal/entries', {
        params: { before: last.created_at },
      });
      setEntries((prev) => [...prev, ...data.entries]);
      setHasMore(data.entries.length >= 30);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [entries, hasMore, isLoadingMore]);

  const remove = useCallback(async (entry: JournalEntry) => {
    // Optimistic removal — the only failure mode is "row already gone", which
    // is the user's desired end state anyway.
    setEntries((prev) => prev.filter((e) => !(e.source === entry.source && e.id === entry.id)));
    try {
      await api.delete(`/api/journal/entries/${entry.source}/${entry.id}`);
    } catch (err) {
      // Re-add if the server pushed back (e.g. 401 because the session expired).
      if (err instanceof AxiosError && err.response?.status !== 404) {
        setEntries((prev) => [entry, ...prev].sort(byCreatedDesc));
        throw err;
      }
    }
  }, []);

  return { entries, isLoading, isLoadingMore, hasMore, error, refetch, loadMore, remove };
}

function byCreatedDesc(a: JournalEntry, b: JournalEntry): number {
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load journal.';
  }
  return 'Could not load journal.';
}
