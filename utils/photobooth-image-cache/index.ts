import { routes } from "@/utils/routes";

// Fans' photobooth images are presigned S3 URLs signed afresh on every API call, so the browser's own cache never
// hits. public/photobooth-sw.js keeps them by S3 object path instead (like the Fan Hub app does), so each image is
// downloaded once per browser. Keep the names and the path test in step with that file.
const WORKER = "/photobooth-sw.js";
const CACHE = "photobooth-images-v1";
const PHOTOBOOTH_IMAGE = /^\/photobooth\/[^/]+\/[^/]+\/final\.png$/;

const cacheKey = (src: string) => {
  try {
    const url = new URL(src);
    return url.hostname.endsWith(".amazonaws.com") && PHOTOBOOTH_IMAGE.test(url.pathname)
      ? url.origin + url.pathname
      : null;
  } catch {
    return null;
  }
};

const hasCacheStorage = () => typeof window !== "undefined" && "caches" in window;

// Only the Recognition pages show these images, so only they get the worker.
export function registerPhotoboothImageCache() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register(WORKER, { scope: routes.ui.recognition, updateViaCache: "none" })
    .catch(() => {
      // Not registered (e.g. blocked by the browser): images load straight from S3 as before.
    });
}

// Drops one image, e.g. after it failed to load: the worker can't check a no-cors response before storing it,
// so a failed download would otherwise stay. The next load downloads it again.
export function evictPhotoboothImage(src: string) {
  const key = cacheKey(src);
  if (!key || !hasCacheStorage()) return;
  caches
    .open(CACHE)
    .then((cache) => cache.delete(key))
    .catch(() => undefined);
}

// On sign-out, so fans' photos don't stay on a shared computer.
export function clearPhotoboothImageCache() {
  if (!hasCacheStorage()) return;
  caches.delete(CACHE).catch(() => undefined);
}
