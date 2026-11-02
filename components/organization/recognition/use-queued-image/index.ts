"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { queueImage } from "@/utils/image-queue";

// Start loading a little before the tile scrolls into view.
const NEAR_VIEW = "300px";

// Loads a fan photo only when its tile is near the screen, and then through the shared image queue (two
// at a time, in order). Returns the ref for the tile, whether the image may render yet, and the handler for
// when it loaded or failed (which frees the slot for the next one).
export function useQueuedImage(src: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // The src that got a slot; keyed by src so a new image queues again.
  const [startedSrc, setStartedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const release = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: NEAR_VIEW }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    const done = queueImage(() => setStartedSrc(src));
    release.current = done;
    return () => {
      done();
      release.current = null;
    };
  }, [near, src]);

  // Loaded or failed: either way the next image can start.
  const settle = useCallback(
    (loaded: boolean) => {
      if (loaded) setLoadedSrc(src);
      release.current?.();
      release.current = null;
    },
    [src]
  );

  return { ref, started: startedSrc === src, loaded: loadedSrc === src, settle };
}
