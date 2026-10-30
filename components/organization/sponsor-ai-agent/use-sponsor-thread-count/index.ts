"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { scopeKey, type AgentScope } from "@/components/organization/sponsor-ai-agent/data";
import { LIST_POLL_MS } from "@/components/organization/sponsor-messages/data";
import { threadsKey } from "@/components/organization/sponsor-messages/use-sponsor-threads";
import { routes } from "@/utils/routes";
import type { ThreadList } from "@/utils/types/sponsor-ai";

// How many conversations Sponsor Messages has for the organisation (or event): GET /threads' ALL count.
// Not the approved drafts: an approved email that's still queued, failed or was skipped (the contact
// unsubscribed) has no conversation. Polled like that list, as approved emails go out over a few minutes.
export function useSponsorThreadCount(scope: AgentScope | null) {
  const key = scopeKey(scope);
  const eventId = scope?.eventId;
  const { data } = useQuery({
    queryKey: [...threadsKey, "count", key],
    queryFn: key
      ? async () => {
          const r = await sponsorRequest<ThreadList>("GET", routes.api.sponsorAiThreads, { params: { eventId, page: 1, limit: 1 } });
          // Thrown so a failed poll keeps the last count on screen.
          if (!r.view) throw new Error(r.message);
          return r.view.counts.ALL;
        }
      : skipToken,
    refetchInterval: LIST_POLL_MS,
  });
  return data ?? null;
}
