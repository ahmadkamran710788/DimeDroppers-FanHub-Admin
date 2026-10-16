"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TicketOverview } from "@/utils/types/tickets";

// The four cards and every ticket campaign, from GET /fanhub/org/tickets/overview.
// `reload` refetches after a campaign is created, edited or a game is detached.
export function useTicketOverview() {
  const [overview, setOverview] = useState<TicketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: TicketOverview[] }>({ endpoint: routes.api.ticketOverview, method: "GET" }).then((result) => {
      if (cancelled) return;
      if (result.success) setOverview(result.data?.data?.[0] ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { overview, loading, reload };
}
