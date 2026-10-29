"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import {
  POLL_MS,
  STUCK_AFTER_MS,
  isActiveRun,
  scopeKey,
  type AgentScope,
} from "@/components/organization/sponsor-ai-agent/data";
import { routes } from "@/utils/routes";
import type { SponsorAiRun, SponsorAiRunList, StartRunBody } from "@/utils/types/sponsor-ai";

const runQueryKey = (id: string | null) => ["sponsor-ai", "run", id] as const;

// The newest search of the organisation or event; null when there is none or it can't be loaded.
async function latestRun(eventId: string | undefined): Promise<SponsorAiRun | null> {
  const r = await sponsorRequest<SponsorAiRunList>("GET", routes.api.sponsorAiRuns, { params: { eventId, page: 1, limit: 1 } });
  return r.view?.items[0] ?? null;
}

async function fetchRun(id: string): Promise<SponsorAiRun> {
  const r = await sponsorRequest<SponsorAiRun>("GET", routes.api.sponsorAiRun(id));
  // Thrown so a failed check keeps the last status on screen.
  if (!r.view) throw new Error(r.message);
  return r.view;
}

// Find Sponsors: starts a search and follows it until it's final. The status is polled with TanStack
// Query (the project uses it for polling only); starting and finding the latest search are plain
// requests. A search still running when the page opens (another tab, a reload) is picked up again.
// `onFinished` runs once when a search followed here ends (COMPLETED, FAILED or BLOCKED_NO_PACKAGES).
export function useSponsorAiRun(scope: AgentScope | null, onFinished: (run: SponsorAiRun) => void) {
  const queryClient = useQueryClient();
  const key = scopeKey(scope);
  const eventId = scope?.eventId;
  // The search shown for a scope: its latest one when the page opened, or the one just started.
  const [current, setCurrent] = useState<{ key: string; id: string | null } | null>(null);
  const [starting, setStarting] = useState(false);
  // A search still running long after it started (see STUCK_AFTER_MS).
  const [stuckId, setStuckId] = useState<string | null>(null);
  // The running search followed to its end, so `onFinished` fires for it once and not for an old one.
  const following = useRef<string | null>(null);

  const show = useCallback(
    (run: SponsorAiRun, forKey: string) => {
      queryClient.setQueryData(runQueryKey(run.id), run);
      if (isActiveRun(run.status)) following.current = run.id;
      setCurrent({ key: forKey, id: run.id });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    latestRun(eventId).then((run) => {
      if (cancelled) return;
      if (run) show(run, key);
      else setCurrent({ key, id: null });
    });
    return () => {
      cancelled = true;
    };
  }, [key, eventId, show]);

  const runId = current?.key === key ? current.id : null;
  const { data: run } = useQuery({
    queryKey: runQueryKey(runId),
    queryFn: runId ? () => fetchRun(runId) : skipToken,
    // A finished search never changes again.
    staleTime: (q) => (isActiveRun(q.state.data?.status) ? 0 : Infinity),
    refetchInterval: (q) => (isActiveRun(q.state.data?.status) ? POLL_MS : false),
  });
  const shown = runId ? (run ?? null) : null;
  const active = isActiveRun(shown?.status);

  const finished = useEffectEvent(onFinished);
  useEffect(() => {
    if (!shown || isActiveRun(shown.status) || following.current !== shown.id) return;
    following.current = null;
    finished(shown);
  }, [shown]);

  const shownId = shown?.id;
  const startedAt = shown?.startedAt;
  useEffect(() => {
    if (!active || !shownId || !startedAt) return;
    const timer = setTimeout(() => setStuckId(shownId), Math.max(0, Date.parse(startedAt) + STUCK_AFTER_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [active, shownId, startedAt]);

  // Answers the response status, so the page can refresh its readiness after a 422.
  const start = useCallback(
    async (body: Omit<StartRunBody, "eventId">) => {
      if (!key) return 0;
      setStarting(true);
      const r = await sponsorRequest<SponsorAiRun>("POST", routes.api.sponsorAiRuns, {
        body: eventId ? { ...body, eventId } : body,
      });
      if (r.view) {
        show(r.view, key);
      } else if (r.status === 409) {
        // Already running (another tab, a double click): follow that one instead.
        const running = await latestRun(eventId);
        if (running) show(running, key);
        toast(r.message ?? "Sponsor AI is already running. Wait for it to finish");
      } else {
        toast.error(r.message ?? "Sponsor AI could not start. Try again in a minute");
      }
      setStarting(false);
      return r.status;
    },
    [key, eventId, show]
  );

  return {
    run: shown,
    active,
    stuck: active && !!shownId && stuckId === shownId,
    starting,
    // The latest search hasn't been looked up yet.
    loading: !!key && current?.key !== key,
    start,
  };
}
