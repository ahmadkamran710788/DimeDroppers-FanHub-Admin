"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ChallengeCampaign, ChallengeStats, EngagementTabPage } from "@/utils/types/engagement";

// The API's largest page.
const LIMIT = 100;

type Page = EngagementTabPage<ChallengeStats, ChallengeCampaign>;

// Every challenge of the organisation and the tab's stats. An organisation has a handful, so they are read
// whole (page by page) and the chips, counts and paging work on them here. `reload` reads them again.
export function useAllChallenges() {
  const [data, setData] = useState<{ stats: ChallengeStats | null; challenges: ChallengeCampaign[] } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const challenges: ChallengeCampaign[] = [];
      let stats: ChallengeStats | null = null;
      for (let page = 1; ; page++) {
        const result = await apiCall<{ data: Page[] }>({
          endpoint: routes.api.engagementChallenges,
          method: "GET",
          data: { page, limit: LIMIT },
        });
        const body = result.success ? result.data?.data?.[0] : undefined;
        if (!body) break;
        stats = body.stats;
        challenges.push(...body.items);
        if (body.pagination.isLast || body.items.length === 0) break;
      }
      if (!cancelled) setData({ stats, challenges });
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { stats: data?.stats ?? null, challenges: data?.challenges ?? [], loading: !data, reload };
}
