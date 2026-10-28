"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TournamentCampaignTeam, TournamentCampaignTeams } from "@/utils/types/campaign";

// A tournament event's teams for a team campaign (GET /campaigns/tournament/events/{id}/teams), all at
// once, in division then name order. The form filters them by division itself.
export function useEventTeams(eventId: string) {
  const [loaded, setLoaded] = useState<{ eventId: string; teams: TournamentCampaignTeam[] } | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiCall<{ data: TournamentCampaignTeams[] }>({ endpoint: routes.api.tournamentCampaignTeams(eventId), method: "GET" }).then(
      (result) => {
        if (cancelled) return;
        const items = result.success ? (result.data?.data?.[0]?.items ?? []) : [];
        setLoaded({
          eventId,
          teams: [...items].sort(
            (a, b) => (a.division?.name ?? "").localeCompare(b.division?.name ?? "") || a.name.localeCompare(b.name)
          ),
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const current = loaded?.eventId === eventId ? loaded : null;
  return { teams: current?.teams ?? [], loading: !!eventId && !current };
}
