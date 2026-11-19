"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteSession, listSessions, type AgentResult } from "@/components/organization/fanhub-ai/agent-api";
import type { MessageState, ThreadSummary } from "@/utils/types/organiser-agent";

// The organiser's chats, newest first. Only chats with a message are listed, and the API stores a chat's
// first message with its reply, so a new chat appears once it has been answered.
export function useAgentThreads() {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((res: AgentResult<ThreadSummary[]>) => {
    if (res.data) {
      setThreads(res.data);
      setError(null);
    } else {
      setError(res.message ?? "Couldn’t load your chats.");
    }
  }, []);

  const refresh = useCallback(() => listSessions().then(apply), [apply]);

  useEffect(() => {
    let cancelled = false;
    listSessions().then((res) => {
      if (!cancelled) apply(res);
    });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  // A reply arrived: a listed chat moves to the top with its new state; a new one needs the list again.
  const touch = useCallback(
    (sessionId: string, state: MessageState | null) => {
      if (!threads?.some((t) => t.id === sessionId)) {
        void refresh();
        return;
      }
      const at = new Date().toISOString();
      setThreads((prev) => {
        const thread = prev?.find((t) => t.id === sessionId);
        if (!prev || !thread) return prev;
        return [{ ...thread, lastState: state ?? thread.lastState, updatedAt: at }, ...prev.filter((t) => t.id !== sessionId)];
      });
    },
    [threads, refresh]
  );

  // Returns whether it was deleted.
  const remove = useCallback(async (id: string) => {
    const res = await deleteSession(id);
    if (res.status !== 200) {
      toast.error(res.message ?? "Couldn’t delete this chat.");
      return false;
    }
    setThreads((prev) => prev?.filter((t) => t.id !== id) ?? prev);
    toast.success("Chat deleted");
    return true;
  }, []);

  return { threads, loading: threads === null && !error, error, refresh, touch, remove };
}
