import { api, TOKEN_STORAGE_KEY } from './api';

// лёгкая клиентская очередь событий: trackEvent копит и шлёт батчем (~3с или 20 событий),
// флашит на pagehide через sendBeacon. Без согласия пользователя - полный no-op.

const QUEUE_LIMIT = 20;
const FLUSH_DELAY_MS = 3000;
const ENDPOINT = '/api/analytics/events';

interface QueuedEvent {
  event_type: string;
  properties?: Record<string, unknown>;
  client_ts: string;
}

let consentGranted = false;
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let bound = false;

export function setAnalyticsConsent(granted: boolean): void {
  consentGranted = granted;
  if (!granted) queue = [];
}

export function trackEvent(eventType: string, properties?: Record<string, unknown>): void {
  if (!consentGranted) return;
  if (typeof eventType !== 'string' || eventType.trim().length === 0) return;
  queue.push({
    event_type: eventType.trim().slice(0, 80),
    properties,
    client_ts: new Date().toISOString(),
  });
  bindLifecycle();
  if (queue.length >= QUEUE_LIMIT) {
    void flush();
    return;
  }
  if (timer === null) {
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, FLUSH_DELAY_MS);
  }
}

export async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    await api.post(ENDPOINT, { events: batch });
  } catch {
    // упал батч - просто роняем. Аналитика не должна блокировать UI.
  }
}

function bindLifecycle(): void {
  if (bound || typeof window === 'undefined') return;
  bound = true;

  // на unload надёжно выживает только sendBeacon/keepalive fetch
  const sendOnExit = () => {
    if (queue.length === 0) return;
    const body = JSON.stringify({ events: queue });
    queue = [];
    try {
      if ('sendBeacon' in navigator) {
        const blob = new Blob([body], { type: 'application/json' });
        // sendBeacon не несёт Authorization, поэтому шлём fetch keepalive с токеном
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          void fetch(ENDPOINT, {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body,
          }).catch(() => undefined);
        } else {
          // без токена - beacon вслепую (бэк отклонит, но мы не упадём)
          navigator.sendBeacon(ENDPOINT, blob);
        }
      }
    } catch {
      // ignore - analytics must never throw on unload.
    }
  };

  // visibilitychange + pagehide вместе покрывают все браузеры
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendOnExit();
  });
  window.addEventListener('pagehide', sendOnExit);
}
