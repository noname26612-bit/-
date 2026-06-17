// Service worker для web-push (Этап 5). Статичный файл, отдаётся как есть из /public — без
// Serwist/offline-кэша (всегда-онлайн сценарий, 3 пользователя). Только пуш + открытие карточки.
// ВНИМАНИЕ: это рантайм service worker (область self/clients), а не модуль приложения.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Пришёл пуш — показываем уведомление. Payload собирает сервер (src/domain/notifications.ts).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "VanMark", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "VanMark";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      data: { url: data.url || "/" },
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      lang: "ru",
      renotify: Boolean(data.tag),
    }),
  );
});

// Тап по уведомлению — фокусируем уже открытое окно карточки или открываем новое.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const target = new URL(url, self.location.origin).href;
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })(),
  );
});
