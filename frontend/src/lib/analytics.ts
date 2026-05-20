import { api, TOKEN_STORAGE_KEY } from './api';

// Lightweight client-side event queue.
//
// Goals:
//  - Cheap fire-and-forget API for the rest of the app (`trackEvent('x', {...})`).
//  - Batches into a single POST every ~3 s or when 20 events queue up.
//  - Flushes on page hide (sendBeacon path) so the last screen of activity isn't lost.
//  - Respects consent: if the user has not opted in, every track call is a no-op
//    and nothing leaves the device. The flag is settable from AuthContext.

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
    // Drop the batch on failure — analytics must never block the UI. A retry
    // queue would risk filling memory if the backend stays down.
  }
}

function bindLifecycle(): void {
  if (bound || typeof window === 'undefined') return;
  bound = true;

  // sendBeacon is the only path that survives an unload reliably. Falls back
  // to a sync XHR-ish API.post if Beacon isn't available.
  const sendOnExit = () => {
    if (queue.length === 0) return;
    const body = JSON.stringify({ events: queue });
    queue = [];
    try {
      if ('sendBeacon' in navigator) {
        const blob = new Blob([body], { type: 'application/json' });
        // sendBeacon doesn't carry our Authorization header, so it'll be
        // rejected by requireAuth. Fall through to fetch keepalive instead.
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
          // Last-ditch beacon (unauthenticated; backend will reject but at
          // least we don't throw).
          navigator.sendBeacon(ENDPOINT, blob);
        }
      }
    } catch {
      // ignore — analytics must never throw on unload.
    }
  };

  // visibilitychange + pagehide together cover all browsers reliably.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendOnExit();
  });
  window.addEventListener('pagehide', sendOnExit);
}
