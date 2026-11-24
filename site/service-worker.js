const CACHE_NAME = "photo-tsum-gh-pages-v3";
const BASE_URL = new URL(self.registration.scope);
const ASSETS = [
  "",
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "title-logo.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-32.png",
  "icons/apple-touch-icon.png"
].map(path => new URL(path, BASE_URL).href);
const HOME_URL = new URL("index.html", BASE_URL).href;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("photo-tsum-gh-pages-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        await (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match(HOME_URL));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  })());
});
