/* Pocket Tally service worker: keeps the app working with no connection. */
const CACHE = "pocket-tally-shell-v1";
const FONT_CACHE = "pocket-tally-fonts-v1";
const SHELL = [
  "./",
  "./index.html",
  "./parser.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fonts: serve from cache, refresh in the background.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // App shell: cached copy first (instant, offline), refreshed in the background
  // so the next launch picks up a new version.
  event.respondWith(staleWhileRevalidate(req, CACHE, req.mode === "navigate" ? "./index.html" : null));
});

async function staleWhileRevalidate(req, cacheName, fallbackPath) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { network.catch(() => {}); return cached; }
  const res = await network;
  if (res) return res;
  if (fallbackPath) {
    const fb = await cache.match(fallbackPath);
    if (fb) return fb;
  }
  return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
}
