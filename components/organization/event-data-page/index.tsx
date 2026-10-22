"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import EventSelect from "@/components/organization/event-select";
import { orgKindOf, useAuth } from "@/context/auth";
import { BracketsTable, DivisionsTable, StandingsTable, VenuesTable } from "@/components/organization/exposure-tables";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposureDivision, ExposureListResponse, ExposureStanding, ExposureVenue } from "@/utils/types/exposure-event";

export type EventDataKind = "divisions" | "venues" | "standings" | "brackets";

const PAGES: Record<EventDataKind, { title: string; description: string; noun: string }> = {
  divisions: { title: "Divisions", description: "Every division of the event, with its brackets.", noun: "divisions" },
  venues: { title: "Venues", description: "Where the event's games are played, with their courts.", noun: "venues" },
  standings: { title: "Standings", description: "Pool standings of the event's teams.", noun: "standings" },
  brackets: { title: "Brackets", description: "The event's brackets, division by division.", noun: "brackets" },
};

// The Exposure endpoint behind each page (brackets come nested in the divisions).
const endpointFor = (kind: EventDataKind, eventId: string) =>
  kind === "venues"
    ? routes.api.exposureEventVenues(eventId)
    : kind === "standings"
      ? routes.api.exposureEventStandings(eventId)
      : routes.api.exposureEventDivisions(eventId);

interface Loaded {
  eventId: string;
  rows: unknown[];
  error: string | null;
}

// Tournament pages for one event's Divisions, Venues, Standings or Brackets. The event is picked at
// the top (the newest one at first; "All Events" stays in the list but these are per event).
export default function EventDataPage({ kind }: { kind: EventDataKind }) {
  const page = PAGES[kind];
  const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const eventId = event?.id ?? "";
  // Tournament only: a school opening the URL goes back to its Command Center.
  const router = useRouter();
  const { org } = useAuth();
  const orgKind = orgKindOf(org);
  useEffect(() => {
    if (orgKind === "school") router.replace(routes.ui.commandCenter);
  }, [orgKind, router]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiCall<ExposureListResponse<unknown>>({
      endpoint: endpointFor(kind, eventId),
      method: "GET",
      data: kind === "standings" ? { display: "Pool" } : undefined,
    }).then((result) => {
      if (cancelled) return;
      setLoaded({
        eventId,
        rows: result.success ? (result.data?.data ?? []) : [],
        error: result.success ? null : result.message || "Failed to load.",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [kind, eventId]);

  const loading = !!eventId && loaded?.eventId !== eventId;
  const rows = loaded?.eventId === eventId ? loaded.rows : [];

  if (orgKind === "school") return null;

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-white text-3xl sm:text-4xl lg:text-6xl font-extrabold font-display uppercase leading-none">{page.title}</h2>
          <p className="text-white text-base font-normal mt-1">{page.description}</p>
        </div>
        <EventSelect
          value={eventId}
          onChange={(id, name) => setEvent(id ? { id, name } : null)}
          selectFirst
        />
      </div>

      <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
        {!eventId ? (
          <p className="py-12 text-center text-sm text-white/60">{`Pick an event to see its ${page.noun}.`}</p>
        ) : (
          <>
            <span className="text-white text-2xl font-extrabold font-display uppercase truncate">{event?.name}</span>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              </div>
            ) : loaded?.error ? (
              <p className="py-12 text-center text-sm text-error">{loaded.error}</p>
            ) : kind === "divisions" ? (
              <DivisionsTable divisions={rows as ExposureDivision[]} />
            ) : kind === "brackets" ? (
              <BracketsTable divisions={rows as ExposureDivision[]} />
            ) : kind === "standings" ? (
              <StandingsTable standings={rows as ExposureStanding[]} />
            ) : (
              <VenuesTable venues={rows as ExposureVenue[]} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
