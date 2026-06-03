import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface MoodPingStatus {
  due: boolean;
  week_of: string;
  last_submitted_week: string | null;
}

// снуз на сессию: закрыл без ответа - не дёргаем до перезагрузки или новой недели
const SNOOZE_KEY = 'kyndill_mood_snooze_week';

export function useMoodPing() {
  const [status, setStatus] = useState<MoodPingStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<MoodPingStatus>('/api/mood-pings/status');
      setStatus(data);
      const snoozed = readSnoozed() === data.week_of;
      if (data.due && !snoozed) {
        setIsOpen(true);
      }
    } catch {
      // Status check failure is silent - the prompt simply won't appear.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(
    async (rating: number, note?: string) => {
      await api.post('/api/mood-pings', { rating, ...(note ? { note } : {}) });
      setIsOpen(false);
      await refresh();
    },
    [refresh],
  );

  const snooze = useCallback(() => {
    if (status?.week_of) writeSnoozed(status.week_of);
    setIsOpen(false);
  }, [status]);

  return { isOpen, status, submit, snooze };
}

function readSnoozed(): string | null {
  try {
    return window.localStorage.getItem(SNOOZE_KEY);
  } catch {
    return null;
  }
}

function writeSnoozed(week: string): void {
  try {
    window.localStorage.setItem(SNOOZE_KEY, week);
  } catch {
    // ignore
  }
}
