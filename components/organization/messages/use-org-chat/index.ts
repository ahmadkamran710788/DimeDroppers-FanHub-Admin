"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchConversations } from "@/components/organization/messages/chat-api";
import type { OrgConversation } from "@/components/organization/messages/types";

// The panel has no socket yet, so new fan messages are picked up by polling the list.
const POLL_MS = 20_000;

// The org's conversations across all teams, refreshed every 20s while the tab is visible.
export function useOrgChat() {
  const [conversations, setConversations] = useState<OrgConversation[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped on every refresh and upsert, so a slower, older response never overwrites a newer list.
  const seq = useRef(0);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    const mine = ++seq.current;
    return fetchConversations().then((list) => {
      if (!mounted.current || mine !== seq.current) return;
      // A failed poll keeps the last list.
      if (list) setConversations(list);
      setLoading(false);
    });
  }, []);

  // Puts a just-created or just-fetched conversation on top without waiting for the next poll.
  const upsert = useCallback((conversation: OrgConversation) => {
    seq.current++;
    setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void refresh();
    }, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  const unreadTotal = useMemo(() => conversations.reduce((sum, c) => sum + c.unreadCount, 0), [conversations]);

  return { conversations, loading, unreadTotal, refresh, upsert };
}
