const VERSION = 'v2';
const CACHE = `orders-${VERSION}`;
const STATIC = 'orders-static';
const SHELL = ['/offline.html', '/icon-192.png', '/icon-512.png'];
const PAGES = [
  '/orders',
  '/products',
  '/stats',
  '/map',
  '/users',
  '/settings',
  '/login',
];

const cachePage = (cache, url) =>
  fetch(url)
    .then(async (res) => {
      if (!res.ok) return;
      const html = await res.clone().text();
      const assets = [
        ...new Set(html.match(/\/_next\/static\/[^"'\\\s)<>]+/g) ?? []),
      ];
      const st = await caches.open(STATIC);
      await Promise.all(
        assets.map((a) =>
          fetch(a)
            .then((r) => (r.ok ? st.put(a, r) : undefined))
            .catch(() => undefined),
        ),
      );
      await cache.put(url, res);
    })
    .catch(() => undefined);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c
          .addAll(SHELL)
          .then(() => Promise.all(PAGES.map((url) => cachePage(c, url)))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== STATIC)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io'))
    return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/offline.html')),
        ),
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icon-')
  ) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(STATIC).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
