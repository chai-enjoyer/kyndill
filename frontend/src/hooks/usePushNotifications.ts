import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

interface PushPublicKeyResponse {
  enabled: boolean;
  public_key: string | null;
}

type BrowserPermission = NotificationPermission | 'unsupported';

const SW_URL = '/kyndill-push-sw.js';

// The VAPID public key never changes during a session — caching it skips a
// network round-trip on every Settings nav. Subscription state can change
// (re-enable, browser rotation), so we only cache the value, not the result.
let cachedPushConfig: PushPublicKeyResponse | null = null;
let inflightPushConfig: Promise<PushPublicKeyResponse> | null = null;

async function fetchPushConfig(): Promise<PushPublicKeyResponse> {
  if (cachedPushConfig) return cachedPushConfig;
  if (inflightPushConfig) return inflightPushConfig;
  inflightPushConfig = api
    .get<PushPublicKeyResponse>('/api/notifications/push/public-key')
    .then((res) => {
      cachedPushConfig = res.data;
      return res.data;
    })
    .finally(() => {
      inflightPushConfig = null;
    });
  return inflightPushConfig;
}

function hasPushSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// iOS Safari only supports Web Push for installed PWAs (added to Home Screen).
function isIosNonPwa(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  if (!isIos) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !standalone;
}

export function usePushNotifications() {
  const supported = hasPushSupport();
  const requiresPwa = isIosNonPwa();
  const [permission, setPermission] = useState<BrowserPermission>(
    supported ? Notification.permission : 'unsupported',
  );
  const [isConfigured, setIsConfigured] = useState<boolean>(cachedPushConfig?.enabled ?? false);
  const [publicKey, setPublicKey] = useState<string | null>(cachedPushConfig?.public_key ?? null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(cachedPushConfig === null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resyncedRef = useRef(false);

  // Ensure subscription on server matches what the browser still has. If the
  // backend dropped a stale subscription (410 Gone) but the browser still has
  // one, re-POST it. If the browser lost the subscription, mark unsubscribed.
  const reconcileSubscription = useCallback(async () => {
    if (!supported) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.post('/api/notifications/push/subscribe', serializeSubscription(subscription)).catch(
          () => undefined,
        );
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch {
      // Reconciliation is best-effort.
    }
  }, [supported]);

  const refresh = useCallback(async () => {
    if (!supported) {
      setIsLoading(false);
      setPermission('unsupported');
      return;
    }

    if (cachedPushConfig === null) setIsLoading(true);
    try {
      const config = await fetchPushConfig();
      setIsConfigured(config.enabled);
      setPublicKey(config.public_key);
      setPermission(Notification.permission);

      const registration = await navigator.serviceWorker.getRegistration(SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
      setError(null);

      if (subscription && !resyncedRef.current) {
        resyncedRef.current = true;
        void reconcileSubscription();
      }
    } catch (err) {
      setError(extractMessage(err, 'Could not check push notification support.'));
    } finally {
      setIsLoading(false);
    }
  }, [supported, reconcileSubscription]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // If the SW was previously installed, keep it warm and updated on every
  // app load. We deliberately do NOT request notification permission here —
  // that only happens on explicit enable().
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration(SW_URL);
        if (existing) {
          await existing.update().catch(() => undefined);
          return;
        }
        // Only register if a subscription exists from a prior session — avoids
        // adding a SW for users who never enabled push.
        const fallback = await navigator.serviceWorker.getRegistration();
        if (fallback?.active?.scriptURL.endsWith('kyndill-push-sw.js')) {
          if (!cancelled) await fallback.update().catch(() => undefined);
        }
      } catch {
        // SW lifecycle is best-effort.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  // The SW broadcasts when the subscription is rotated by the browser
  // (pushsubscriptionchange). We re-fetch to reflect the new state in the UI.
  useEffect(() => {
    if (!supported) return;
    function handle(event: MessageEvent) {
      const data = event.data as { type?: string } | null;
      if (data?.type === 'kyndill:resubscribe') {
        void refresh();
      }
    }
    navigator.serviceWorker.addEventListener('message', handle);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handle);
    };
  }, [supported, refresh]);

  const enable = useCallback(async () => {
    if (!supported) throw new Error('This browser does not support push notifications.');
    if (requiresPwa) {
      throw new Error(
        'On iOS, add Kyndill to your Home Screen first to receive push notifications.',
      );
    }
    const key = publicKey ?? (await fetchPublicKey());
    if (!key) throw new Error('Push notifications are not configured on the server.');

    setIsSaving(true);
    try {
      const nextPermission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const registration = await navigator.serviceWorker.register(SW_URL, { updateViaCache: 'none' });
      await registration.update().catch(() => undefined);

      // Wait briefly for the SW to be active before subscribing — fresh
      // installs can race subscribe() against an installing worker.
      await waitForActiveWorker(registration);

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(key),
        }));

      await api.post('/api/notifications/push/subscribe', serializeSubscription(subscription));
      setIsConfigured(true);
      setPublicKey(key);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      const message = extractMessage(err, 'Could not enable push notifications.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [publicKey, supported, requiresPwa]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setIsSaving(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.post('/api/notifications/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setError(null);
    } catch (err) {
      const message = extractMessage(err, 'Could not disable push notifications.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [supported]);

  const sendTest = useCallback(async () => {
    setIsSaving(true);
    try {
      await api.post('/api/notifications/push/test');
      setError(null);
    } catch (err) {
      const message = extractMessage(err, 'Could not send a test notification.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return useMemo(
    () => ({
      supported,
      requiresPwa,
      permission,
      isConfigured,
      isSubscribed,
      isLoading,
      isSaving,
      error,
      enable,
      disable,
      sendTest,
      refresh,
    }),
    [
      supported,
      requiresPwa,
      permission,
      isConfigured,
      isSubscribed,
      isLoading,
      isSaving,
      error,
      enable,
      disable,
      sendTest,
      refresh,
    ],
  );
}

async function fetchPublicKey(): Promise<string | null> {
  const { data } = await api.get<PushPublicKeyResponse>('/api/notifications/push/public-key');
  return data.enabled ? data.public_key : null;
}

function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
}

async function waitForActiveWorker(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) return;
  await new Promise<void>((resolve) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) {
      resolve();
      return;
    }
    const handle = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', handle);
        resolve();
      }
    };
    worker.addEventListener('statechange', handle);
    // Safety net: never hang the enable flow forever.
    window.setTimeout(() => resolve(), 2500);
  });
}

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output.buffer;
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
