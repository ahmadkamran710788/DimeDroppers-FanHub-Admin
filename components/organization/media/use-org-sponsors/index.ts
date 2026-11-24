"use client";

import { useEffect, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import apiCall, { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { OrgSponsor, OrgSponsors } from "@/utils/types/org-sponsors";

const visible = (data: OrgSponsors[] | undefined) => (data?.[0]?.sponsors ?? []).filter((s) => s.visibleToFans);

// One game's sponsors: those whose package part holds the game, plus physical-asset and whole-package ones.
// The game brings its own event, so no eventId. Null when the API refuses it (e.g. 404 for a game it
// doesn't know), quietly: the caller then falls back to the organisation's sponsors.
async function gameSponsors(gameId: string): Promise<OrgSponsor[] | null> {
  try {
    const query = new URLSearchParams({ status: "ACTIVE", gameId });
    const res = await backendFetch(`${routes.api.orgSponsors}?${query}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: OrgSponsors[] };
    return visible(body.data);
  } catch {
    return null;
  }
}

// The sponsors fans see on the organisation right now (paid, running orders), in the API's order.
// With `gameId`, only the sponsors shown at that game. Otherwise a tournament asks for the event picked in
// the shared picker (its sponsors plus organisation-wide ones). Fetched on every mount. `sponsors` is null
// while loading.
export function useOrgSponsors(gameId?: string) {
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  const { event } = useSelectedEvent();
  const eventId = isTournament ? (event?.id ?? "") : "";
  const key = `${gameId ?? ""}|${eventId}`;
  const [loaded, setLoaded] = useState<{ key: string; sponsors: OrgSponsor[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const orgSponsors = () =>
      apiCall<{ data: OrgSponsors[] }>({
        endpoint: routes.api.orgSponsors,
        method: "GET",
        data: { status: "ACTIVE", ...(eventId && { eventId }) },
      }).then((result) => (result.success ? visible(result.data?.data) : []));

    (async () => {
      const sponsors = (gameId ? await gameSponsors(gameId) : null) ?? (await orgSponsors());
      if (!cancelled) setLoaded({ key, sponsors });
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, eventId, key]);

  return { sponsors: loaded?.key === key ? loaded.sponsors : null };
}
