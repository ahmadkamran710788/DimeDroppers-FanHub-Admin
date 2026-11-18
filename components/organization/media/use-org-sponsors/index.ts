"use client";

import { useEffect, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { OrgSponsor, OrgSponsors } from "@/utils/types/org-sponsors";

// The sponsors fans see on the organisation right now (paid, running orders), in the API's order.
// A tournament asks for the event picked in the shared picker (its sponsors plus organisation-wide ones).
// Fetched on every mount. `sponsors` is null while loading.
export function useOrgSponsors() {
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  const { event } = useSelectedEvent();
  const eventId = isTournament ? (event?.id ?? "") : "";
  const [loaded, setLoaded] = useState<{ eventId: string; sponsors: OrgSponsor[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: OrgSponsors[] }>({
      endpoint: routes.api.orgSponsors,
      method: "GET",
      data: { status: "ACTIVE", ...(eventId && { eventId }) },
    }).then((result) => {
      if (cancelled) return;
      const sponsors = result.success ? (result.data?.data?.[0]?.sponsors ?? []) : [];
      setLoaded({ eventId, sponsors: sponsors.filter((s) => s.visibleToFans) });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { sponsors: loaded?.eventId === eventId ? loaded.sponsors : null };
}
