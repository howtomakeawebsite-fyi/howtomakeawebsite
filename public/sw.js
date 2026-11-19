/* Service worker: lets the installed app open key pages without internet, with sensible caching,
   and shows notifications (sent from the private /notifications-admin/ page). */
// Change the version (v1 to v2 and so on) to clear every saved copy on visitors' phones.
const VERSION = "church-v2";
const PRECACHE = ["/", "/plan-your-visit/", "/contact/", "/give/", "/offline/", "/brand/logo-mark.svg", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: network first, fall back to the saved copy, then the offline page.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline/"))),
    );
    return;
  }

  // Build files have unique names, so the saved copy is always right: cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })),
    );
    return;
  }

  // Pictures, fonts and icons can be replaced under the same name: show the saved copy straight away,
  // fetch a fresh one in the background, and never save a "not found" answer.
  if (/\.(woff2|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const fresh = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; });
        return hit || fresh;
      }),
    );
  }
});

/* Notifications (sent from /notifications-admin/). */
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(
    self.registration.showNotification(data.title || "New message", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

// Tapping a notification opens its link: an open window of the site is reused if there is one.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const same = wins.find((w) => w.url === target);
      if (same) return same.focus();
      const ours = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (ours && new URL(target).origin === self.location.origin && "navigate" in ours) {
        return ours.navigate(target).then((w) => (w || ours).focus());
      }
      return self.clients.openWindow(target);
    }),
  );
});
