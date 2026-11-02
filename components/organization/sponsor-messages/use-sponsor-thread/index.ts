"use client";

import { useCallback } from "react";
import { keepPreviousData, skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorRequest, type SponsorApiResult } from "@/components/sponsor/sponsor-api";
import { SENDING_POLL_MS } from "@/components/organization/sponsor-messages/data";
import { routes } from "@/utils/routes";
import type { ThreadDetail, ThreadReplyBody } from "@/utils/types/sponsor-ai";

// A failed load with its status: 404 is unknown, or its first email hasn't gone out yet (just approved).
class ThreadLoadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const threadKey = (id: string | null, stamp: string | undefined) => ["sponsor-ai", "thread", id, stamp ?? ""] as const;

async function fetchThread(id: string): Promise<ThreadDetail> {
  const r = await sponsorRequest<ThreadDetail>("GET", routes.api.sponsorAiThread(id));
  // Thrown so a failed check keeps the last load on screen.
  if (!r.view) throw new ThreadLoadError(r.message ?? "Couldn't load the conversation", r.status);
  return r.view;
}

// An email or reply handed to the mail provider, not yet sent.
const isSending = (thread: ThreadDetail | undefined) => !!thread?.messages.some((m) => m.status === "QUEUED");

// One conversation (GET /threads/:id) with every email and reply. It loads again when the list shows it
// changed (`stamp`: its last activity, and its handler, which the agent can hand over without writing),
// when the tab comes back into view, and every few seconds while an email is still sending, so it turns
// Sent / Delivered. The actions answer the whole conversation, shown as is, then `onChanged` refreshes the
// list: `stop` ends it, `takeOver` / `handBack` move the replies between the organisation and the agent,
// `reply` emails one from the panel.
export function useSponsorThread(id: string | null, stamp: string | undefined, onChanged: () => void) {
  const queryClient = useQueryClient();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: threadKey(id, stamp),
    queryFn: id ? () => fetchThread(id) : skipToken,
    // The last load stays on screen while the next one is on its way.
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (isSending(q.state.data) ? SENDING_POLL_MS : false),
    refetchOnWindowFocus: true,
    retry: (count, err) => !(err instanceof ThreadLoadError && err.status === 404) && count < 1,
  });

  const settle = useCallback(
    (r: SponsorApiResult<ThreadDetail>, success: string, failure: string) => {
      if (r.view) {
        queryClient.setQueryData(threadKey(id, stamp), r.view);
        toast.success(success);
        onChanged();
        return true;
      }
      toast.error(r.message ?? failure);
      // Stopped meanwhile (an unsubscribe, a bounce): show it as it is now.
      if (r.status === 409) {
        refetch();
        onChanged();
      }
      return false;
    },
    [queryClient, id, stamp, onChanged, refetch]
  );

  // Follow-ups that haven't gone out are cancelled.
  const stop = useCallback(async () => {
    if (!id) return false;
    const r = await sponsorRequest<ThreadDetail>("POST", routes.api.sponsorAiStopThread(id));
    return settle(r, "Conversation stopped. No more emails go to this sponsor", "Couldn't stop the conversation. Try again");
  }, [id, settle]);

  // An answer or follow-up the agent had queued and not sent yet is cancelled.
  const takeOver = useCallback(async () => {
    if (!id) return false;
    const r = await sponsorRequest<ThreadDetail>("POST", routes.api.sponsorAiTakeOverThread(id));
    return settle(r, "You're handling this conversation now", "Couldn't take over the conversation. Try again");
  }, [id, settle]);

  // A reply still unanswered gets the agent's answer about two minutes later.
  const handBack = useCallback(async () => {
    if (!id) return false;
    const r = await sponsorRequest<ThreadDetail>("POST", routes.api.sponsorAiHandBackThread(id));
    return settle(r, "Sponsor AI Agent is handling this conversation again", "Couldn't hand the conversation back. Try again");
  }, [id, settle]);

  // Emailed in the same conversation, to the address the sponsor last wrote from. Resolves to whether it
  // was queued, or the field message to show under the box; the box keeps its text until it's queued.
  const reply = useCallback(
    async (text: string): Promise<{ sent: boolean; error?: string }> => {
      if (!id) return { sent: false };
      const body: ThreadReplyBody = { body: text };
      const r = await sponsorRequest<ThreadDetail>("POST", routes.api.sponsorAiReplyThread(id), { body });
      if (r.status === 400 && r.errors?.length) return { sent: false, error: r.errors[0].message };
      return { sent: settle(r, "Reply on its way to the sponsor", "Couldn't send the reply. Try again") };
    },
    [id, settle]
  );

  const failed = !data && error ? error : null;
  const notSent = failed instanceof ThreadLoadError && failed.status === 404;
  return {
    thread: data ?? null,
    loading: !!id && isPending,
    notSent,
    error: failed && !notSent ? failed.message || "Couldn't load the conversation" : null,
    stop,
    takeOver,
    handBack,
    reply,
  };
}
