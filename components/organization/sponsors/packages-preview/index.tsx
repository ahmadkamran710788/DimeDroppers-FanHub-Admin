"use client";

import { useEffect, useState } from "react";
import FilterDropdown from "@/components/common/filter-dropdown";
import Loader from "@/components/common/loader";
import { CalendarDays } from "lucide-react";
import { orgKindOf, useAuth } from "@/context/auth";
import GamesBreakdown from "@/components/sponsor/find-organizations/games-breakdown";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { SponsorEventOption, SponsorPackages, UnavailableReason } from "@/utils/types/sponsor-packages";

const EVENT_REASONS: Record<UnavailableReason, string> = {
  NO_SLOTS: "no slots switched on",
  NO_TEAMS: "no teams yet",
  NO_GAMES: "no teams yet",
  EVENT_ENDED: "ended",
  TOURNAMENT_INCOMPLETE: "format not set",
};

// GET /org/sponsor-packages/events answers the events as the whole `data` list.
async function loadEvents(): Promise<SponsorEventOption[] | null> {
  try {
    const res = await backendFetch(routes.api.orgSponsorEvents, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorEventOption[]) : null;
  } catch {
    return null;
  }
}

// "What sponsors can buy": the organization's three packages and its physical assets, priced exactly as
// sponsors see them (GET /org/sponsor-packages/packages). A tournament picks one of its events first;
// an event it doesn't offer answers 404, shown as an empty state.
export default function PackagesPreview() {
  const { org } = useAuth();
  const kind = orgKindOf(org);
  const isTournament = kind === "tournament";
  const [events, setEvents] = useState<SponsorEventOption[] | null>(null);
  const [eventId, setEventId] = useState("");
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorPackages; error?: string } | null>(null);

  useEffect(() => {
    if (!isTournament) return;
    loadEvents().then((items) => {
      setEvents(items ?? []);
      // Start on the first event sponsors can buy, else the first one.
      const first = items?.find((e) => e.isOffered) ?? items?.[0];
      if (first) setEventId(first.id);
    });
  }, [isTournament]);

  // Nothing loads until the org type is known, and for a tournament until an event is picked.
  const key = kind === null ? "" : isTournament ? eventId : "school";
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    sponsorRequest<SponsorPackages>("GET", routes.api.orgSponsorPackages, {
      params: isTournament ? { eventId: key } : undefined,
    }).then((r) => {
      if (!cancelled) setLoaded({ key, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, isTournament]);

  const current = loaded?.key === key ? loaded : null;
  const view = current?.view;
  const event = events?.find((e) => e.id === eventId);

  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-extrabold text-2xl uppercase text-white leading-none">What sponsors can buy</h3>
          <p className="text-sm text-white/70">Your packages and physical assets, priced as sponsors see them.</p>
        </div>
        {isTournament && events && events.length > 0 && (
          <FilterDropdown
            label="Select event"
            icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
            options={events.map((e) => ({
              label: `${e.name?.trim() || "Untitled event"}${e.isOffered ? "" : ` (${e.unavailableReason ? EVENT_REASONS[e.unavailableReason] : "not offered"})`}`,
              value: e.id,
            }))}
            value={eventId}
            onChange={(id) => id && setEventId(id)}
            clearable={false}
            align="right"
          />
        )}
      </div>

      {isTournament && events?.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/60">
          None of your events sell sponsor packages yet. Set an event&apos;s format in Inventory first.
        </p>
      ) : !current ? (
        <Loader />
      ) : !view ? (
        <p className="py-8 text-center text-sm text-white/60">
          {isTournament && event && !event.isOffered
            ? `Sponsors can't buy packages for this event yet: ${event.unavailableReason ? EVENT_REASONS[event.unavailableReason] : "it isn't offered"}.`
            : (current.error ?? "Packages are not available yet.")}
        </p>
      ) : (
        <>
          <p className="text-sm text-white/70">
            {`Priced by ${view.priceBasis.basisLabel.toLowerCase()}: ${view.priceBasis.quantity}${
              view.priceBasis.tournamentFormatLabel ? ` · ${view.priceBasis.tournamentFormatLabel}` : ""
            }`}
          </p>
          <GamesBreakdown priceBasis={view.priceBasis} />
          {view.packages.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/60">Packages are not available yet.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3 text-white">
              {view.packages.map((p) => (
                <PackageCard key={p.tier} pkg={p} showPlacementValues />
              ))}
            </div>
          )}
          <div className="text-white">
            <PhysicalAddOns orgName={view.organization.name ?? "Your organization"} physicalAssets={view.physicalAssets} />
          </div>
        </>
      )}
    </section>
  );
}
