/* WeatherApp service worker — offline shell + last-data cache */
const CACHE = "weatherapp-v1";
const CORE = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./scripts/main.js",
  "./scripts/fx.js",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(CORE.map((u) => c.add(u)))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const isAPI = (url) =>
  /open-meteo\.com|bigdatacloud\.net|corsproxy\.io|allorigins\.win/.test(url);

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = request.url;

  // App navigations: network-first, fall back to cached shell (offline)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Weather APIs: network-first, cache the latest so it works offline
  if (isAPI(url)) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (new URL(url).origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
  }
});
