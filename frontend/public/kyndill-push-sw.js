// Bump this when you change the SW so browsers re-register and re-evaluate.
const SW_VERSION = 'kyndill-push-sw@2';

self.addEventListener('install', (event) => {
  // Take over without forcing the user to reload the tab.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Kyndill',
    body: 'You have a new update.',
    icon: '/favicon.svg',
    url: '/',
    tag: 'kyndill-update',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/favicon.svg',
    badge: '/favicon.svg',
    // A unique tag prevents OS-level dedup from silently dropping fresh pushes
    // when they share a category. We append a timestamp salt so each one
    // surfaces individually unless the payload explicitly sets a sticky tag.
    tag: payload.tag ? `${payload.tag}-${Date.now()}` : `kyndill-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    vibrate: payload.silent ? undefined : [120, 60, 120],
    silent: Boolean(payload.silent),
    data: { url: payload.url || '/', kind: payload.tag || 'kyndill' },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  const targetOrigin = new URL(targetUrl).origin;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Prefer an exact-route window, else any window on the same origin.
      const exact = allClients.find((client) => 'focus' in client && client.url === targetUrl);
      const sameOrigin = allClients.find(
        (client) => 'focus' in client && new URL(client.url).origin === targetOrigin,
      );

      if (exact) {
        return exact.focus();
      }
      if (sameOrigin && 'navigate' in sameOrigin) {
        try {
          await sameOrigin.navigate(targetUrl);
          return sameOrigin.focus();
        } catch {
          return sameOrigin.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Browser rotated/revoked the subscription. The page-side hook listens for
  // a refresh signal on next load; nothing to do here without VAPID key.
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'kyndill:resubscribe', version: SW_VERSION });
      });
    }),
  );
});
