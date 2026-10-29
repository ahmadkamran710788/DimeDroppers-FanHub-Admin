"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConversations } from "@/components/organization/messages/chat-api";
import type { OrgConversation } from "@/components/organization/messages/types";

// The panel has no socket yet, so new fan messages are picked up by polling the list.
const POLL_MS = 20_000;

const conversationsKey = ["org-chat", "conversations"] as const;

async function loadConversations(): Promise<OrgConversation[]> {
  const list = await fetchConversations();
  // Thrown so a failed poll keeps the last list on screen.
  if (!list) throw new Error("Couldn't load the conversations.");
  return list;
}

// The org's conversations across all teams, polled every 20s with TanStack Query (which pauses while
// the tab is hidden).
export function useOrgChat() {
  const queryClient = useQueryClient();
  const { data, isPending, refetch } = useQuery({
    queryKey: conversationsKey,
    queryFn: loadConversations,
    refetchInterval: POLL_MS,
  });
  const conversations = useMemo(() => data ?? [], [data]);

  const refresh = useCallback(() => refetch().then(() => undefined), [refetch]);

  // Puts a just-created or just-fetched conversation on top without waiting for the next poll. A poll
  // already in flight is cancelled first, so its older list can't overwrite this one.
  const upsert = useCallback(
    (conversation: OrgConversation) => {
      void queryClient.cancelQueries({ queryKey: conversationsKey }).then(() =>
        queryClient.setQueryData<OrgConversation[]>(conversationsKey, (prev = []) => [
          conversation,
          ...prev.filter((c) => c.id !== conversation.id),
        ])
      );
    },
    [queryClient]
  );

  const unreadTotal = useMemo(() => conversations.reduce((sum, c) => sum + c.unreadCount, 0), [conversations]);

  return { conversations, loading: isPending, unreadTotal, refresh, upsert };
}
