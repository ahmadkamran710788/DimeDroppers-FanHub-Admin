"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import toast, { type Toast } from "react-hot-toast";
import Button from "@/components/common/button";
import { sponsorList } from "@/components/sponsor/sponsor-api";
import { POLL_LIMIT_MS, POLL_MS, isLookupActive } from "@/components/sponsor/profile/data";
import { profileQueryKey } from "@/components/sponsor/profile/use-sponsor-profile";
import { routes } from "@/utils/routes";
import type { SponsorLocationFetchRun } from "@/utils/types/sponsor-profile";

// A location fetch the sponsor started, followed on every sponsor page: they can leave the profile while it runs
// and are told when it's done (FANHUB_SPONSOR_LOCATION_FETCH_FRONTEND.md). Its foundCount, set while it's
// saving, is also what the profile's progress shows.

const runQueryKey = (id: string | null) => ["sponsor", "location-fetch-run", id] as const;

// From the fetch history (GET /locations/fetches), which lists running fetches too.
async function fetchRun(id: string): Promise<SponsorLocationFetchRun> {
  const r = await sponsorList<SponsorLocationFetchRun>(routes.api.sponsorLocationFetches);
  const run = r.items?.find((item) => item.id === id);
  // Thrown so a failed check keeps the last status.
  if (!run) throw new Error(r.message ?? "Couldn't check the location fetch.");
  return run;
}

const plural = (n: number) => (n === 1 ? "1 new store" : `${n} new stores`);

interface DoneToastProps {
  t: Toast;
  message: string;
  onView: () => void;
}

// "27 new stores found. View" in a toast.
function DoneToast({ t, message, onView }: DoneToastProps) {
  return (
    <span className="flex items-center gap-3 flex-wrap">
      {message}
      <Button
        variant="text"
        size="sm"
        label="View"
        onClick={() => {
          toast.dismiss(t.id);
          onView();
        }}
        className="h-8 font-semibold text-[#5b3fd6] hover:text-[#2a1a80]"
      />
    </span>
  );
}

interface SponsorLocationFetchContextValue {
  // The fetch followed, as last checked; null when none is or it hasn't been checked yet.
  run: SponsorLocationFetchRun | null;
  // Follows a fetch that is running (`seed`: its answer when it was just started). A fetch already followed to
  // its end isn't followed again.
  follow: (runId: string, seed?: SponsorLocationFetchRun) => void;
  // The fetch whose results the sponsor asked to see from the toast; the profile scrolls to them.
  revealRunId: string | null;
  clearReveal: () => void;
}

const SponsorLocationFetchContext = createContext<SponsorLocationFetchContextValue | null>(null);

export function SponsorLocationFetchProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [followed, setFollowed] = useState<{ id: string; since: number } | null>(null);
  const [revealRunId, setRevealRunId] = useState<string | null>(null);
  // Fetches whose end has been announced: a profile loaded before that (still showing it running) can't
  // follow them again.
  const announced = useRef(new Set<string>());

  const runId = followed?.id ?? null;
  const since = followed?.since ?? 0;
  const { data } = useQuery({
    queryKey: runQueryKey(runId),
    queryFn: runId ? () => fetchRun(runId) : skipToken,
    // A finished fetch never changes again.
    staleTime: (q) => (isLookupActive(q.state.data?.status) ? 0 : Infinity),
    // Until it's done (or not yet seen), for POLL_LIMIT_MS at most, as the profile does.
    refetchInterval: (q) =>
      (!q.state.data || isLookupActive(q.state.data.status)) && Date.now() - since < POLL_LIMIT_MS ? POLL_MS : false,
  });
  const run = runId && data?.id === runId ? data : null;

  const follow = useCallback(
    (id: string, seed?: SponsorLocationFetchRun) => {
      if (announced.current.has(id)) return;
      if (seed) queryClient.setQueryData(runQueryKey(id), seed);
      setFollowed((prev) => (prev?.id === id ? prev : { id, since: Date.now() }));
    },
    [queryClient]
  );

  const clearReveal = useCallback(() => setRevealRunId(null), []);

  // "View": the profile shows the latest fetch's results and scrolls to them.
  const view = useCallback(
    (id: string) => {
      setRevealRunId(id);
      if (window.location.pathname !== routes.ui.sponsor.profile) router.push(routes.ui.sponsor.profile);
    },
    [router]
  );

  // The followed fetch is done (it was running when followed): the profile reloads and the sponsor is told,
  // on whichever sponsor page they're on.
  const announce = useEffectEvent((done: SponsorLocationFetchRun) => {
    announced.current.add(done.id);
    void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    const failed = done.status === "FAILED";
    const message = failed
      ? "We couldn’t finish finding your stores."
      : done.foundCount > 0
        ? `${plural(done.foundCount)} found.`
        : "No new stores found.";
    (failed ? toast.error : toast.success)(
      (t) => <DoneToast t={t} message={message} onView={() => view(done.id)} />,
      { id: `location-fetch:${done.id}`, duration: 8000 }
    );
  });

  useEffect(() => {
    if (run && !isLookupActive(run.status) && !announced.current.has(run.id)) announce(run);
  }, [run]);

  const value = useMemo<SponsorLocationFetchContextValue>(
    () => ({ run, follow, revealRunId, clearReveal }),
    [run, follow, revealRunId, clearReveal]
  );

  return <SponsorLocationFetchContext.Provider value={value}>{children}</SponsorLocationFetchContext.Provider>;
}

export function useLocationFetchWatch() {
  const context = useContext(SponsorLocationFetchContext);
  if (!context) throw new Error("useLocationFetchWatch must be used inside SponsorLocationFetchProvider");
  return context;
}
