"use client";

import { useEffect, useState } from "react";
import type { EngagementTab } from "@/components/engagement/engagement-rows";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ChallengeCampaign,
  ChallengeStats,
  EngagementTabPage,
  PredictionCampaign,
  PredictionStats,
  VotingCampaign,
  VotingStats,
} from "@/utils/types/engagement";

type TabStats = PredictionStats | VotingStats | ChallengeStats;
type TabCampaign = PredictionCampaign | VotingCampaign | ChallengeCampaign;

const ENDPOINT: Record<EngagementTab, string> = {
  predictions: routes.api.engagementPredictions,
  voting: routes.api.engagementVoting,
  challenges: routes.api.engagementChallenges,
};

// The API's page size cap; every page is loaded so the table holds all of the school's campaigns.
const PAGE_LIMIT = 100;

// One tab's cards and every campaign of its type.
export function useEngagementCampaigns(tab: EngagementTab) {
  const [stats, setStats] = useState<TabStats | null>(null);
  const [campaigns, setCampaigns] = useState<TabCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows: TabCampaign[] = [];
      let first: TabStats | null = null;
      for (let page = 1; ; page++) {
        const result = await apiCall<{ data: EngagementTabPage<TabStats, TabCampaign>[] }>({
          endpoint: ENDPOINT[tab],
          method: "GET",
          data: { page, limit: PAGE_LIMIT },
        });
        const data = result.success ? result.data?.data?.[0] : undefined;
        if (!data) break;
        first ??= data.stats;
        rows.push(...data.items);
        if (data.pagination.isLast) break;
      }
      if (cancelled) return;
      setStats(first);
      setCampaigns(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return { stats, campaigns, loading };
}
