/* Service worker — workshop shell (خطوة 36). Network-first; offline fallback for /workshop navigations. */
const CACHE = "dasm-inspection-workshop-v1";
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isWorkshopNavigation(request) {
  if (request.method !== "GET") return false;
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    return (
      url.pathname === "/workshop" || url.pathname.startsWith("/workshop/")
    );
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isWorkshopNavigation(request)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response("غير متصل", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
