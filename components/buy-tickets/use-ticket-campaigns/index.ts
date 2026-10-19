"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TicketCampaign } from "@/utils/types/tickets";

// Every ticket campaign of the organisation, newest first, from GET /fanhub/org/tickets/campaigns
// (`data` is the list). `reload` refetches after a campaign is created or its games change.
export function useTicketCampaigns() {
  const [campaigns, setCampaigns] = useState<TicketCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: TicketCampaign[] }>({ endpoint: routes.api.ticketCampaigns, method: "GET" }).then((result) => {
      if (cancelled) return;
      if (result.success) setCampaigns(result.data?.data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { campaigns, loading, reload };
}
