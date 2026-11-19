"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createSession,
  getSession,
  postConfirmation,
  postMessage,
} from "@/components/organization/fanhub-ai/agent-api";
import {
  POLL_MS,
  REPLY_WAIT_CONNECTED_MS,
  REPLY_WAIT_MS,
  browserTimeZone,
  newRequestId,
} from "@/components/organization/fanhub-ai/data";
import { useAgentSocket } from "@/components/organization/fanhub-ai/use-agent-socket";
import type {
  AgentSocketMessage,
  MessageResponse,
  MessageState,
  Thread,
  ThreadMessage,
} from "@/utils/types/organiser-agent";

const threadKey = (id: string) => ["organiser-agent", "thread", id] as const;

class ThreadLoadError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function fetchThread(id: string): Promise<Thread> {
  const res = await getSession(id);
  // Thrown so a failed check keeps the thread on screen.
  if (!res.data) {
    const message = res.status === 404 ? "This chat was deleted." : (res.message ?? "Couldn’t load this chat.");
    throw new ThreadLoadError(message, res.status);
  }
  return res.data;
}

// One turn in flight in a thread: a message (or option) sent, or a Confirm / Cancel.
interface Turn {
  // Tells this turn from a newer one in the same thread.
  key: string;
  kind: "message" | "confirm";
  // Matched against the socket reply. A confirmation's ("confirm:<invocationId>") is known once its 202 is back.
  clientRequestId: string | null;
  // How many messages the thread had when it was sent: the reply is the first assistant message after them.
  baseCount: number;
  // The organiser's bubble until the stored copy arrives (the worker, not the API, stores it).
  text: string;
  // The option tapped, so a failed message can be sent again as it was.
  optionId: string | null;
  startedAt: number;
  // "late": no reply in time (see the timer). "failed": the turn couldn't run (the socket said why).
  status: "waiting" | "late" | "failed";
  error?: string;
}

export interface TurnNotice {
  kind: "late" | "failed";
  error?: string;
}

const isAnswered = (thread: Thread | undefined, turn: Turn | undefined) =>
  !!turn && !!thread && thread.messages.slice(turn.baseCount).some((m) => m.role === "ASSISTANT");

// The open thread is only polled when a reply is due and the socket can't bring it. A slow change's later
// "Update: …" comes on the socket too (clientRequestId "update:<messageId>"), so nothing else is polled.
const pollInterval = (thread: Thread | undefined, turn: Turn | undefined, connected: boolean): number | false =>
  !connected && turn?.status === "waiting" && !isAnswered(thread, turn) ? POLL_MS : false;

// A reply the thread couldn't be reloaded for: added as it came, after the organiser's own message.
function withReply(thread: Thread, turn: Turn | undefined, response: MessageResponse): Thread {
  if (thread.messages.some((m) => m.id === response.messageId)) return thread;
  const at = new Date().toISOString();
  const first = response.blocks[0];
  const added: ThreadMessage[] = [];
  if (turn && thread.messages.length <= turn.baseCount) {
    added.push({ id: `local-${turn.key}`, role: "USER", text: turn.text, state: null, blocks: [], createdAt: at });
  }
  added.push({
    id: response.messageId,
    role: "ASSISTANT",
    text: first?.type === "text" ? first.text : null,
    state: response.state,
    blocks: response.blocks,
    createdAt: at,
  });
  return { ...thread, messages: [...thread.messages, ...added] };
}

interface UseAgentThreadOptions {
  // null for a new chat: the thread is made with the first message.
  threadId: string | null;
  // A new chat got its thread: select it.
  onCreated: (id: string) => void;
  // A reply came for a thread (open or not): the list shows its new state.
  onReply: (sessionId: string, state: MessageState | null) => void;
}

// The open chat with the organiser agent: its messages, sending, Confirm / Cancel, and the reply of each
// turn, which comes on the socket (FANHUB_ORGANISER_AGENT_FRONTEND.md §4–7).
export function useAgentThread({ threadId, onCreated, onReply }: UseAgentThreadOptions) {
  const queryClient = useQueryClient();
  // Per thread, so a reply still due in one chat keeps waiting while another is open.
  const [turns, setTurns] = useState<Record<string, Turn>>({});
  // Confirmations the API called expired before their expiresAt.
  const [expiredTokens, setExpiredTokens] = useState<ReadonlySet<string>>(() => new Set());

  const patchTurn = useCallback((sessionId: string, key: string, patch: Partial<Turn>) => {
    setTurns((prev) => (prev[sessionId]?.key === key ? { ...prev, [sessionId]: { ...prev[sessionId], ...patch } } : prev));
  }, []);

  const dropTurn = useCallback((sessionId: string, key: string) => {
    setTurns((prev) => {
      if (prev[sessionId]?.key !== key) return prev;
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  }, []);

  const turn = threadId ? turns[threadId] : undefined;

  const receive = useCallback(
    async (message: AgentSocketMessage) => {
      const { sessionId, clientRequestId, response, error } = message;
      const due = turns[sessionId];
      // A message comes back with the id it was sent with, a confirmation with the "confirm:<invocationId>" of its
      // 202, a slow change's later update with "update:<messageId>" (no turn waits for that one).
      const mine = !!due && due.clientRequestId === clientRequestId;
      onReply(sessionId, response?.state ?? null);

      if (error) {
        if (mine) patchTurn(sessionId, due.key, { status: "failed", error });
        return;
      }
      // The reply is stored by now: reload the thread if it's open (another one reloads when it's opened).
      await queryClient.refetchQueries({ queryKey: threadKey(sessionId), type: "active" });
      if (response) {
        queryClient.setQueryData<Thread>(threadKey(sessionId), (prev) =>
          prev ? withReply(prev, mine ? due : undefined, response) : prev
        );
      }
      // "Already working on this" (nothing stored): the real reply is still to come.
      if (mine && response?.state !== "PENDING") dropTurn(sessionId, due.key);
    },
    [turns, onReply, patchTurn, dropTurn, queryClient]
  );

  const connected = useAgentSocket((message) => void receive(message));

  const query = useQuery({
    queryKey: threadId ? threadKey(threadId) : ["organiser-agent", "thread", "new"],
    queryFn: threadId ? () => fetchThread(threadId) : skipToken,
    refetchInterval: (q) => pollInterval(q.state.data, turn, connected),
    // A just-created or just-reloaded thread isn't fetched again on open.
    staleTime: 5_000,
    // The socket replays nothing it missed, so coming back to the tab checks the thread.
    refetchOnWindowFocus: true,
    retry: (count, err) => !(err instanceof ThreadLoadError && err.status >= 400 && err.status < 500) && count < 1,
  });
  const thread = threadId ? (query.data ?? null) : null;
  const answered = isAnswered(query.data, turn);

  // No reply in time: say so. With the socket up every turn ends in a reply or an error, so the long wait only
  // catches a backend whose worker isn't running; without it, the polls give up after REPLY_WAIT_MS.
  useEffect(() => {
    if (!threadId || !turn || turn.status !== "waiting" || answered) return;
    const wait = connected ? REPLY_WAIT_CONNECTED_MS : REPLY_WAIT_MS;
    const timer = setTimeout(
      () => patchTurn(threadId, turn.key, { status: "late" }),
      Math.max(0, turn.startedAt + wait - Date.now())
    );
    return () => clearTimeout(timer);
  }, [threadId, turn, answered, connected, patchTurn]);

  // Back online with a reply due: it may have come while the socket was down.
  const catchUp = useEffectEvent(() => {
    if (turn?.status === "waiting" && !answered) void query.refetch();
  });
  useEffect(() => {
    if (connected) catchUp();
  }, [connected]);

  // Sends a typed message, or an option the organiser tapped (`text` is then its label). Returns whether it
  // went (the box is cleared then); on failure the backend's message is toasted.
  const send = useCallback(
    async (text: string, optionId: string | null = null): Promise<boolean> => {
      let id = threadId;
      if (!id) {
        const created = await createSession(browserTimeZone());
        if (!created.data) {
          toast.error(created.message ?? "Couldn’t start a chat.");
          return false;
        }
        id = created.data.id;
        queryClient.setQueryData(threadKey(id), created.data);
        onCreated(id);
      }
      const clientRequestId = newRequestId();
      const baseCount = queryClient.getQueryData<Thread>(threadKey(id))?.messages.length ?? 0;
      const sessionId = id;
      setTurns((prev) => ({
        ...prev,
        [sessionId]: {
          key: clientRequestId,
          kind: "message",
          clientRequestId,
          baseCount,
          text,
          optionId,
          startedAt: Date.now(),
          status: "waiting",
        },
      }));

      const res = await postMessage(sessionId, { text, clientRequestId, optionId });
      if (res.status === 202) return true;
      if (res.status === 200) {
        // Already answered: the reply is stored.
        await queryClient.refetchQueries({ queryKey: threadKey(sessionId) });
        dropTurn(sessionId, clientRequestId);
        return true;
      }
      dropTurn(sessionId, clientRequestId);
      toast.error(res.message ?? "Couldn’t send your message.");
      return false;
    },
    [threadId, queryClient, onCreated, dropTurn]
  );

  // Confirm or Cancel on a change the agent previewed. Nothing changes until it's confirmed.
  const answer = useCallback(
    async (token: string, decision: "CONFIRM" | "CANCEL"): Promise<boolean> => {
      if (!threadId) return false;
      const sessionId = threadId;
      const key = newRequestId();
      const baseCount = queryClient.getQueryData<Thread>(threadKey(sessionId))?.messages.length ?? 0;
      setTurns((prev) => ({
        ...prev,
        [sessionId]: {
          key,
          kind: "confirm",
          clientRequestId: null,
          baseCount,
          // The thread stores the answer as the organiser's message.
          text: decision === "CONFIRM" ? "Confirm" : "Cancel",
          optionId: null,
          startedAt: Date.now(),
          status: "waiting",
        },
      }));

      const res = await postConfirmation(token, decision);
      if (res.status === 202 && res.data && "clientRequestId" in res.data) {
        patchTurn(sessionId, key, { clientRequestId: res.data.clientRequestId });
        return true;
      }
      if (res.status === 200) {
        // Already handled: the thread has its reply.
        await queryClient.refetchQueries({ queryKey: threadKey(sessionId) });
        dropTurn(sessionId, key);
        return true;
      }
      dropTurn(sessionId, key);
      if (res.status === 410) setExpiredTokens((prev) => new Set(prev).add(token));
      toast.error(res.message ?? "Couldn’t send your answer.");
      return false;
    },
    [threadId, queryClient, patchTurn, dropTurn]
  );

  // A message the worker couldn't run goes again as a new turn. A Confirm doesn't: the backend keeps one job per
  // confirmation and decision, so the organiser asks again for a fresh preview instead.
  const canRetry = turn?.kind === "message" && turn.status === "failed" && !answered;
  const retry = useCallback(() => {
    if (turn?.kind === "message" && turn.status === "failed") void send(turn.text, turn.optionId);
  }, [turn, send]);

  const waiting = turn?.status === "waiting" && !answered;
  const notice: TurnNotice | null =
    turn && !answered && turn.status !== "waiting" ? { kind: turn.status, error: turn.error } : null;
  // The organiser's message until the thread has the stored copy (a failed turn may never be stored).
  const stored = (query.data?.messages.length ?? 0) > (turn?.baseCount ?? 0);
  const outgoing = turn && !answered && turn.status !== "failed" && !stored ? turn.text : null;

  return {
    thread,
    loading: !!threadId && query.isPending,
    loadError: query.error instanceof Error ? query.error.message : null,
    waiting,
    notice,
    outgoing,
    expiredTokens,
    connected,
    send,
    answer,
    canRetry,
    retry,
    refresh: () => void query.refetch(),
  };
}
