"use client";

import { useEffect, useState } from "react";
import type { GameTab } from "@/components/organization/engagement/game-campaign-tab";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { EngagementTabPage } from "@/utils/types/engagement";

type Counts = { all: number | null; active: number | null; finalized: number | null };

const EMPTY: Counts = { all: null, active: null, finalized: null };

const ENDPOINT: Record<GameTab, string> = {
  predictions: routes.api.engagementPredictions,
  voting: routes.api.engagementVoting,
};

// How many predictions or polls each status chip holds (for the search typed), read from the list's
// totals: one small page per status. null until known.
export function useCampaignCounts(tab: GameTab, search: string): Counts {
  const key = `${tab}:${search}`;
  const [loaded, setLoaded] = useState<{ key: string; counts: Counts } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const totalFor = (status: string) =>
      apiCall<{ data: EngagementTabPage<unknown, unknown>[] }>({
        endpoint: ENDPOINT[tab],
        method: "GET",
        data: { page: 1, limit: 1, ...(search && { search }), ...(status && { status }) },
      }).then((r) => (r.success ? (r.data?.data?.[0]?.pagination.total ?? null) : null));
    Promise.all([totalFor(""), totalFor("ACTIVE"), totalFor("RESOLVED")]).then(([all, active, finalized]) => {
      if (!cancelled) setLoaded({ key, counts: { all, active, finalized } });
    });
    return () => {
      cancelled = true;
    };
  }, [tab, search, key]);

  return loaded?.key === key ? loaded.counts : EMPTY;
}
