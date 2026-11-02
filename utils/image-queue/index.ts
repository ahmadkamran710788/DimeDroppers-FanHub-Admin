// Loads large images in batches of two, in the order they asked: the next two start only once the
// current two have all loaded (or failed), so a grid of fan photos fills in two at a time instead of
// every image starting together and none finishing for a long time.

const BATCH_SIZE = 2;

type Start = () => void;

// Downloads of the current batch still running.
let running = 0;
const waiting: Start[] = [];

const nextBatch = () => {
  if (running > 0) return;
  const batch = waiting.splice(0, BATCH_SIZE);
  running = batch.length;
  batch.forEach((start) => start());
};

// Queues a download. `start` runs when its batch begins; call the returned `release` once the image has
// loaded or failed (or when it's no longer wanted, e.g. the tile unmounted) — before or after it started.
export function queueImage(start: Start): () => void {
  let state: "waiting" | "running" | "done" = "waiting";
  const run = () => {
    state = "running";
    start();
  };
  waiting.push(run);
  // After the tiles rendered together have all queued, so the first batch is a full two.
  queueMicrotask(nextBatch);
  return () => {
    if (state === "waiting") {
      const i = waiting.indexOf(run);
      if (i !== -1) waiting.splice(i, 1);
    } else if (state === "running") {
      running -= 1;
      nextBatch();
    }
    state = "done";
  };
}
