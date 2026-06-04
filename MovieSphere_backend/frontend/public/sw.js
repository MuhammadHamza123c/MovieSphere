self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      data: { url: data.data?.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch {
    event.waitUntil(self.registration.showNotification("MovieSphere", { body: event.data.text() }));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (client.url === url && "focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
