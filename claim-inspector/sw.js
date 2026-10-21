/* Claim Inspector service worker: precache the app shell, serve offline, refresh in background. */
const VERSION = 'ci-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './engine.js', './ui-kit.js', './forms.js', './data/cpt.js', './data/icd.js', './data/modifiers.js', './data/reference.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts etc: network only
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => {
    const fetching = fetch(e.request).then((res) => { if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone())); return res; }).catch(() => hit);
    return hit || fetching;
  }));
});
