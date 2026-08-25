self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'ThreadZW', body: '', data: {} };
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    tag: data.tag || undefined,
    renotify: false,
    data: data.data || {}
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'ThreadZW', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});
