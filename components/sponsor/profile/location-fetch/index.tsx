"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import FetchAreasForm from "@/components/sponsor/profile/fetch-areas-form";
import FetchHistory from "@/components/sponsor/profile/fetch-history";
import FetchResults from "@/components/sponsor/profile/fetch-results";
import FetchStatus from "@/components/sponsor/profile/fetch-status";
import { PAGE_SIZE, fetchTime, isLookupActive } from "@/components/sponsor/profile/data";
import { CARD_TITLE, PROFILE_CARD, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type {
  SponsorLocationFetchResult,
  SponsorLocationFetchRun,
  SponsorProfileView,
  StartLocationFetchBody,
} from "@/utils/types/sponsor-profile";

interface LocationFetchProps {
  profile: SponsorProfileView;
  // Applies a change to the profile shown (a fetch that just started).
  onChange: (update: (profile: SponsorProfileView) => SponsorProfileView) => void;
  // Reloads the profile, e.g. when a fetch was already running.
  reload: () => void;
  // The latest fetch is still running after the profile stopped following it.
  timedOut: boolean;
}

// Finds the brand's other stores on request (FANHUB_SPONSOR_LOCATION_FETCH_FRONTEND.md). A local business is
// searched in its main location's city; a regional or national brand in the states and cities it picks. The
// profile is followed while the fetch runs; then its results show per area, and earlier fetches from the
// history.
export default function LocationFetch({ profile, onChange, reload, timedOut }: LocationFetchProps) {
  const lookup = profile.locationsFetch;
  const main = profile.mainLocation;
  const active = isLookupActive(lookup.status);
  const byArea = lookup.mode === "SELECTED_AREAS";
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  // A fetch from the history shown instead of the latest one; null for the latest.
  const [shownRunId, setShownRunId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorLocationFetchResult; error?: string } | null>(
    null
  );

  // The latest fetch's results wait for it to finish, and load again when it does.
  const viewRunId = shownRunId ?? (active ? null : lookup.runId);
  const resultKey = viewRunId ? (shownRunId ? viewRunId : `${viewRunId}|${lookup.status}|${lookup.completedAt}`) : "";

  useEffect(() => {
    if (!viewRunId) return;
    let cancelled = false;
    sponsorRequest<SponsorLocationFetchResult>("GET", routes.api.sponsorLocationFetch(viewRunId), {
      params: { limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setLoaded({ key: resultKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [viewRunId, resultKey]);

  const result = loaded?.key === resultKey ? loaded : null;

  // A local business's main location needs a city and state to be searched.
  const mainCityMissing = !byArea && !!main && !(main.city && main.state);
  const hint = !main
    ? "Add your main location first: the first location you add below becomes your main one."
    : byArea
      ? "Pick the states and cities to search for your stores. The ones found are added to your locations."
      : mainCityMissing
        ? "Add a city and state to your main location first."
        : `Finds your other stores in ${main.city}, ${main.state}.`;

  // Starts a fetch (a local business sends no body). Resolves the errors for the area picker to show, or null.
  async function start(body?: StartLocationFetchBody): Promise<Record<string, string> | null> {
    setStarting(true);
    const r = await sponsorRequest<SponsorLocationFetchRun>("POST", routes.api.sponsorLocationsFetch, { body });
    setStarting(false);
    if (r.view) {
      const run = r.view;
      // The profile follows it from here (it's polled while the fetch runs).
      onChange((p) => ({
        ...p,
        locationsFetch: {
          ...p.locationsFetch,
          canFetch: false,
          runId: run.id,
          status: run.status,
          areas: run.areas,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          error: run.error,
        },
      }));
      setShownRunId(null);
      setPicking(false);
      return null;
    }
    const message = r.message ?? "Couldn't start the location fetch. Try again.";
    // Already running (another tab): show that one.
    if (r.status === 409) {
      toast.error(message);
      setPicking(false);
      reload();
      return null;
    }
    // A state or city the API refused is marked in the picker ("states.0" under the states).
    if (body && r.status === 400) {
      const fields: Record<string, string> = {};
      for (const e of r.errors ?? []) {
        const key = e.path.startsWith("states") ? "states" : e.path.startsWith("cities.") ? e.path : "";
        if (key && !fields[key]) fields[key] = e.message;
      }
      if (Object.keys(fields).length) return fields;
      if (/state or city/i.test(message)) return { states: message };
    }
    toast.error(message);
    // "Add your main location first": the profile is out of date.
    if (/main location/i.test(message)) reload();
    return null;
  }

  return (
    <section aria-label="Find your locations" className={cn(PROFILE_CARD, "flex flex-col gap-4")}>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className={CARD_TITLE}>Find your locations</h3>
          <p className="text-sm text-[#a8a8a8] mt-[2px]">{hint}</p>
        </div>
        <Button
          label={starting && !byArea ? "Starting…" : "Fetch locations"}
          icon={<Search className="size-4" strokeWidth={2.4} />}
          onClick={() => (byArea ? setPicking(true) : void start())}
          disabled={!lookup.canFetch || active || starting || picking || mainCityMissing}
          className={cn(SMALL_BUTTON, "bg-[#2a2148] border border-[#8b6dff] text-white font-bold")}
        />
      </div>

      {picking && <FetchAreasForm onSubmit={start} onCancel={() => setPicking(false)} />}

      {shownRunId ? (
        <div className="flex items-center gap-3 flex-wrap text-sm text-[#a8a8a8]">
          {result?.view ? `The fetch from ${fetchTime(result.view.createdAt)}.` : "An earlier fetch."}
          <Button
            variant="text"
            size="sm"
            label="Show the latest fetch"
            onClick={() => setShownRunId(null)}
            className="h-11 text-sm font-semibold text-[#c9b8ff] hover:text-white"
          />
        </div>
      ) : (
        <FetchStatus lookup={lookup} timedOut={timedOut} run={result?.view ?? null} />
      )}

      {viewRunId &&
        (!result ? (
          <Loader />
        ) : result.view ? (
          <FetchResults key={resultKey} result={result.view} />
        ) : (
          <p className="text-sm text-[#a8a8a8]">{result.error ?? "Couldn't load the results of this fetch."}</p>
        ))}

      {lookup.runId && (
        <FetchHistory
          refreshKey={`${lookup.runId}|${lookup.status}`}
          shownRunId={shownRunId ?? lookup.runId}
          onShow={(runId) => setShownRunId(runId === lookup.runId ? null : runId)}
        />
      )}
    </section>
  );
}
