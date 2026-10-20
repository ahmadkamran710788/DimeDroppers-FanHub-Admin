"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { Campaign, CampaignListPage, CampaignStats } from "@/utils/types/campaign";

// The API's page size cap; every page is loaded so the tabs can group, filter and search locally.
const PAGE_LIMIT = 100;

// Every campaign of the organisation plus the fundraising stats; `reload` refetches both
// after a campaign is created, edited, launched, ended or deleted.
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCampaigns = async () => {
      const rows: Campaign[] = [];
      for (let page = 1; ; page++) {
        const result = await apiCall<{ data: CampaignListPage[] }>({
          endpoint: routes.api.campaigns,
          method: "GET",
          data: { page, limit: PAGE_LIMIT },
        });
        const data = result.success ? result.data?.data?.[0] : undefined;
        if (!data) break;
        rows.push(...data.items);
        if (data.pagination.isLast) break;
      }
      return rows;
    };

    Promise.all([
      loadCampaigns(),
      apiCall<{ data: CampaignStats[] }>({ endpoint: routes.api.campaignStats, method: "GET" }),
    ]).then(([rows, statsResult]) => {
      if (cancelled) return;
      setCampaigns(rows);
      setStats(statsResult.success ? (statsResult.data?.data?.[0] ?? null) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { campaigns, stats, loading, reload };
}
