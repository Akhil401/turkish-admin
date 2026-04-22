importScripts("https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js");

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.contents?.en || data.body || "New notification",
    icon: "https://i.imgur.com/SXiYUHr.png",
    badge: "https://i.imgur.com/SXiYUHr.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.headings?.en || "Turkish Kelleci",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
