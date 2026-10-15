"use client";

import { useCallback, useEffect, useState } from "react";
import type { EngagementTab } from "@/components/engagement/engagement-rows";
import { ENGAGEMENT_PAGE_SIZE } from "@/components/engagement/settings-table";
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

interface LoadedPage {
  // Which tab and page these rows belong to.
  key: string;
  campaigns: TabCampaign[];
  total: number;
  // Bumped on every fetch, so the table re-seeds its rows even when the page stays the same.
  version: number;
}

// One tab's cards and one page of its campaigns, paged by the API. Pages already seen come back
// from apiCall's cache; the cards stay on screen while another page loads. `reload` refetches the
// current page in place (e.g. for the API's new displayStatus after a status change).
export function useEngagementCampaigns(tab: EngagementTab, page: number) {
  const [stats, setStats] = useState<TabStats | null>(null);
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [reloads, setReloads] = useState(0);
  const key = `${tab}:${page}`;

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: EngagementTabPage<TabStats, TabCampaign>[] }>({
      endpoint: ENDPOINT[tab],
      method: "GET",
      data: { page, limit: ENGAGEMENT_PAGE_SIZE },
    }).then((result) => {
      if (cancelled) return;
      const data = result.success ? result.data?.data?.[0] : undefined;
      if (data) setStats(data.stats);
      setLoaded((prev) => ({
        key: `${tab}:${page}`,
        campaigns: data?.items ?? [],
        total: data?.pagination.total ?? 0,
        version: (prev?.version ?? 0) + 1,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [tab, page, reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);

  const current = loaded?.key === key ? loaded : null;
  return {
    stats,
    campaigns: current?.campaigns ?? [],
    // Kept from the last page while the next one loads, so the pager doesn't jump.
    total: loaded?.total ?? 0,
    loading: !current,
    version: current?.version ?? 0,
    reload,
  };
}
