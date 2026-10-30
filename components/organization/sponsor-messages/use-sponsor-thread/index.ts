"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { ThreadDetail } from "@/utils/types/sponsor-ai";

interface Loaded {
  // The conversation, list activity and reload it answered.
  view: string;
  thread: ThreadDetail | null;
  status: number;
  message?: string;
}

// One conversation (GET /threads/:id) with every email and reply. It loads again when the list shows new
// activity on it (`lastActivityAt`: a reply, a follow-up sent, a stop) and when the tab comes back into
// view, so delivery ticks catch up. `stop` ends the conversation (POST /threads/:id/stop).
export function useSponsorThread(id: string | null, lastActivityAt: string | undefined, onStopped: () => void) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);
  const view = id ? `${id}:${lastActivityAt ?? ""}:${version}` : "";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    sponsorRequest<ThreadDetail>("GET", routes.api.sponsorAiThread(id)).then((r) => {
      if (!cancelled) setLoaded({ view, thread: r.view ?? null, status: r.status, message: r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [id, view]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const stop = useCallback(async () => {
    if (!id) return false;
    const r = await sponsorRequest<ThreadDetail>("POST", routes.api.sponsorAiStopThread(id));
    if (r.view) {
      const thread = r.view;
      setLoaded((prev) => (prev ? { ...prev, thread } : prev));
      toast.success("Conversation stopped. No more emails go to this sponsor");
      onStopped();
      return true;
    }
    toast.error(r.message ?? "Couldn't stop the conversation. Try again");
    // Already stopped meanwhile (an unsubscribe, a bounce): show it as it is now.
    if (r.status === 409) {
      reload();
      onStopped();
    }
    return false;
  }, [id, reload, onStopped]);

  // The last load of this conversation stays on screen while the next one is on its way.
  const current = loaded && id && loaded.view.startsWith(`${id}:`) ? loaded : null;
  return {
    thread: current?.thread ?? null,
    loading: !!id && (!current || current.view !== view),
    // 404: unknown, or its first email hasn't gone out yet (just approved and still queued).
    notSent: current?.status === 404,
    error: current && !current.thread && current.status !== 404 ? (current.message ?? "Couldn't load the conversation") : null,
    stop,
  };
}
