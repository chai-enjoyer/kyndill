import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

interface PushPublicKeyResponse {
  enabled: boolean;
  public_key: string | null;
}

type BrowserPermission = NotificationPermission | 'unsupported';

function hasPushSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function usePushNotifications() {
  const supported = hasPushSupport();
  const [permission, setPermission] = useState<BrowserPermission>(
    supported ? Notification.permission : 'unsupported',
  );
  const [isConfigured, setIsConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supported) {
      setIsLoading(false);
      setPermission('unsupported');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get<PushPublicKeyResponse>('/api/notifications/push/public-key');
      setIsConfigured(data.enabled);
      setPublicKey(data.public_key);
      setPermission(Notification.permission);

      const registration = await navigator.serviceWorker.getRegistration('/kyndill-push-sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not check push notification support.'));
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!supported) throw new Error('This browser does not support push notifications.');
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

      const registration = await navigator.serviceWorker.register('/kyndill-push-sw.js');
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
  }, [publicKey, supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setIsSaving(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/kyndill-push-sw.js');
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
