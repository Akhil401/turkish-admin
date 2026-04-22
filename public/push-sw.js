// Native Web Push Service Worker
// This handles background push notifications via VAPID

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'New Notification', body: event.data.text() };
  }

  const title = data.title || 'Turkish Kelleci Admin';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: 'https://i.imgur.com/SXiYUHr.png',
    badge: 'https://i.imgur.com/SXiYUHr.png',
    data: { url: data.url || 'https://turkish-admin.pages.dev/' },
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://turkish-admin.pages.dev/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith('https://turkish-admin.pages.dev') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
