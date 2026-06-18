self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'MovieSphere', body: 'New trailers available' }
  const options = {
    title: data.title || 'MovieSphere',
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(options.title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || '/home'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.host) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) clients.openWindow(url)
    })
  )
})
