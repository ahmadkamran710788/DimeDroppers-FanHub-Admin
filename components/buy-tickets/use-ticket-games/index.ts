"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TicketGamesPage, TicketScheduleGame } from "@/utils/types/tickets";

export type GameTicketFilter = "all" | "on-sale" | "not-on-sale" | "ended";

interface GamesQuery {
  page: number;
  limit: number;
  search: string;
  status: GameTicketFilter;
  // "" = any.
  homeAway: "" | "home" | "away" | "neutral";
  sports: string;
  level: string;
}

interface LoadedGames {
  // The query these rows belong to.
  key: string;
  games: TicketScheduleGame[];
  total: number;
}

// One page of the Schedules table from GET /fanhub/org/tickets/games, paged and filtered by the
// API. The total stays while the next page loads so the pager doesn't jump.
export function useTicketGames(query: GamesQuery) {
  const { page, limit, search, status, homeAway, sports, level } = query;
  const [loaded, setLoaded] = useState<LoadedGames | null>(null);
  const [reloads, setReloads] = useState(0);
  const key = JSON.stringify({ page, limit, search, status, homeAway, sports, level });

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: TicketGamesPage[] }>({
      endpoint: routes.api.ticketGames,
      method: "GET",
      data: { page, limit, status, ...(search && { search }), ...(homeAway && { homeAway }), ...(sports && { sports }), ...(level && { level }) },
    }).then((result) => {
      if (cancelled) return;
      const data = result.success ? result.data?.data?.[0] : undefined;
      setLoaded({
        key: JSON.stringify({ page, limit, search, status, homeAway, sports, level }),
        games: data?.items ?? [],
        total: data?.pagination.total ?? 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, status, homeAway, sports, level, reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  const current = loaded?.key === key ? loaded : null;
  return { games: current?.games ?? [], total: loaded?.total ?? 0, loading: !current, reload };
}
