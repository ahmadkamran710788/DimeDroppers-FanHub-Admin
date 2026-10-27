// Keeps fans' photobooth images by their S3 object path instead of the full presigned URL. The backend signs a
// new URL on every API call, so the browser's own cache never hits and each 5.5 MB image was downloaded again on
// every load; this is the Fan Hub app's `cacheKey: 'photobooth-${jobId}'`. A job's final.png is written once and
// never changes, so the path is a safe key. Registered by utils/photobooth-image-cache.

const CACHE = "photobooth-images-v1";
const MAX_ENTRIES = 200;
const PHOTOBOOTH_IMAGE = /^\/photobooth\/[^/]+\/[^/]+\/final\.png$/;

// Downloads in flight by cache key, so the gallery and the wall showing the same image share one.
const inflight = new Map();

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n.startsWith("photobooth-images-") && n !== CACHE).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only <img> loads (no-cors): an opaque response can't answer a CORS request.
  if (request.method !== "GET" || request.mode !== "no-cors") return;
  const url = new URL(request.url);
  if (!url.hostname.endsWith(".amazonaws.com") || !PHOTOBOOTH_IMAGE.test(url.pathname)) return;
  event.respondWith(fromCache(url).catch(() => fetch(request)));
});

async function fromCache(url) {
  const key = url.origin + url.pathname;
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key);
  if (hit) return hit;
  let pending = inflight.get(key);
  if (!pending) {
    pending = download(cache, key, url.href).finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  await pending;
  return (await cache.match(key)) ?? fetch(url.href, { mode: "no-cors", credentials: "omit" });
}

async function download(cache, key, href) {
  // From the URL alone, not the page's request, so a tile re-rendering mid-download doesn't abort it.
  const response = await fetch(href, { mode: "no-cors", credentials: "omit" });
  await cache.put(key, response);
  const keys = await cache.keys();
  // Oldest first (keys come back in the order they were added).
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((k) => cache.delete(k)));
}
