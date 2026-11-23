"use client";

import { useEffect, useState } from "react";
import type { EventFilters } from "@/components/sponsor/find-organizations/data";
import { toQuery } from "@/components/sponsor/sponsor-api";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { SponsorEventOption, SponsorOrganizationListItem } from "@/utils/types/sponsor-packages";

const NO_EVENTS: SponsorEventOption[] = [];

export interface TournamentEvents {
  // The selected organization is a tournament whose events are still loading.
  loading: boolean;
  // Its events that can be sponsored (the others aren't listed); empty for any other organization.
  events: SponsorEventOption[];
  error?: string;
  // The picked event, the first one until the sponsor picks another.
  event?: SponsorEventOption;
  pick: (eventId: string) => void;
}

// The selected tournament's events, filtered like the search (its stores, radius and genders), and the one
// picked: the list under its card and the packages panel share them.
export function useTournamentEvents(
  org: SponsorOrganizationListItem | undefined,
  eventFilters: EventFilters | undefined
): TournamentEvents {
  const orgId = org?.organizationType === "TOURNAMENT" ? org.id : "";
  const query = toQuery({ ...eventFilters });
  const key = orgId ? `${orgId}|${query}` : "";
  const [loaded, setLoaded] = useState<{ key: string; items: SponsorEventOption[]; error?: string } | null>(null);
  const [pickedId, setPickedId] = useState("");

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    backendEvents(orgId, query).then((items) => {
      if (cancelled) return;
      setLoaded(
        items
          ? { key: `${orgId}|${query}`, items: items.filter((e) => e.isOffered) }
          : { key: `${orgId}|${query}`, items: [], error: "Couldn't load this tournament's events." }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, query]);

  const current = key && loaded?.key === key ? loaded : null;
  const events = current?.items ?? NO_EVENTS;
  // An id picked in another tournament, or no longer listed, falls back to the first event.
  const event = events.find((e) => e.id === pickedId) ?? events[0];

  return { loading: !!key && !current, events, error: current?.error, event, pick: setPickedId };
}

// GET /organizations/:id/events answers the events as the whole `data` list.
async function backendEvents(orgId: string, query: string): Promise<SponsorEventOption[] | null> {
  try {
    const res = await backendFetch(`${routes.api.sponsorOrgEvents(orgId)}${query}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorEventOption[]) : null;
  } catch {
    return null;
  }
}
