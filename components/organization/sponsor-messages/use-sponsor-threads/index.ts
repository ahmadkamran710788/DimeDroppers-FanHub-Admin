"use client";

import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { LIST_POLL_MS, SEARCH_DEBOUNCE_MS, THREADS_PER_PAGE } from "@/components/organization/sponsor-messages/data";
import { routes } from "@/utils/routes";
import type { ConversationStatusFilter, ThreadList } from "@/utils/types/sponsor-ai";

export const threadsKey = ["sponsor-ai", "threads"] as const;

interface ThreadsQuery {
  eventId?: string;
  status: ConversationStatusFilter;
  search: string;
  page: number;
}

async function fetchThreads({ eventId, status, search, page }: ThreadsQuery): Promise<ThreadList> {
  const r = await sponsorRequest<ThreadList>("GET", routes.api.sponsorAiThreads, {
    params: { eventId, status, search: search || undefined, page, limit: THREADS_PER_PAGE },
  });
  // Thrown so a failed poll keeps the last list on screen.
  if (!r.view) throw new Error(r.message);
  return r.view;
}

// Sponsor Messages' list (GET /threads), polled with TanStack Query as there is no socket yet: a reply,
// a follow-up or an unsubscribe moves a conversation to the top. `ready` is false while a tournament
// hasn't picked its event. The search is sent once typing pauses.
export function useSponsorThreads(ready: boolean, query: ThreadsQuery) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(query.search);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query.search]);

  const asked = { ...query, search };
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...threadsKey, asked.eventId ?? "all", asked.status, asked.search, asked.page],
    queryFn: ready ? () => fetchThreads(asked) : skipToken,
    refetchInterval: LIST_POLL_MS,
    // The last page stays on screen while another filter or page loads.
    placeholderData: keepPreviousData,
  });

  // After a stop, so the list shows it without waiting for the next poll.
  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: threadsKey }), [queryClient]);

  return {
    list: data ?? null,
    loading: ready && isPending,
    error: isError && !data ? error.message || "Couldn't load the conversations. Try again" : null,
    refresh,
  };
}
