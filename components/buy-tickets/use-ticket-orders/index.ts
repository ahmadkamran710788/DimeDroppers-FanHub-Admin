"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TicketOrder, TicketOrdersPage, TicketOrderStatus } from "@/utils/types/tickets";

interface OrdersQuery {
  page: number;
  limit: number;
  search: string;
  // "" = any.
  status: "" | TicketOrderStatus;
  campaignId: string;
  scheduleEventId: string;
}

interface LoadedOrders {
  // The query these rows belong to.
  key: string;
  orders: TicketOrder[];
  total: number;
}

// One page of ticket orders from GET /fanhub/org/tickets/orders, paged and filtered by the API.
// The total stays while the next page loads so the pager doesn't jump.
export function useTicketOrders({ page, limit, search, status, campaignId, scheduleEventId }: OrdersQuery) {
  const [loaded, setLoaded] = useState<LoadedOrders | null>(null);
  const key = JSON.stringify({ page, limit, search, status, campaignId, scheduleEventId });

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: TicketOrdersPage[] }>({
      endpoint: routes.api.ticketOrders,
      method: "GET",
      data: {
        page,
        limit,
        ...(search && { search }),
        ...(status && { status }),
        ...(campaignId && { campaignId }),
        ...(scheduleEventId && { scheduleEventId }),
      },
    }).then((result) => {
      if (cancelled) return;
      const data = result.success ? result.data?.data?.[0] : undefined;
      setLoaded({
        key: JSON.stringify({ page, limit, search, status, campaignId, scheduleEventId }),
        orders: data?.items ?? [],
        total: data?.pagination.total ?? 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, status, campaignId, scheduleEventId]);

  const current = loaded?.key === key ? loaded : null;
  return { orders: current?.orders ?? [], total: loaded?.total ?? 0, loading: !current };
}
