self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'TresApps Waitlist';
  const options = {
    body: data.body || '¡Tu mesa está lista!',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
