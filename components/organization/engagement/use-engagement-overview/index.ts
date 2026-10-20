"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { EngagementOverview } from "@/utils/types/engagement";

// The Overview's cards and Campaign Types rows, from GET /fanhub/org/engagement/overview.
export function useEngagementOverview() {
  const [overview, setOverview] = useState<EngagementOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: EngagementOverview[] }>({ endpoint: routes.api.engagementOverview, method: "GET" }).then((result) => {
      if (cancelled) return;
      setOverview(result.success ? (result.data?.data?.[0] ?? null) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { overview, loading };
}
