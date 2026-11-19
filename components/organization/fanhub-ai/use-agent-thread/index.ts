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
  PENDING_REPLY_WAIT_MS,
  POLL_MS,
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
  startedAt: number;
  // "late": no reply within REPLY_WAIT_MS. "failed": the worker couldn't run it.
  status: "waiting" | "late" | "failed";
  error?: string;
}

export interface TurnNotice {
  kind: "late" | "failed";
  error?: string;
}

const isAnswered = (thread: Thread | undefined, turn: Turn | undefined) =>
  !!turn && !!thread && thread.messages.slice(turn.baseCount).some((m) => m.role === "ASSISTANT");

// The open thread is only polled when a reply is due and the socket can't bring it, or when the agent stored
// a "working on it" reply whose result is added later without a socket message.
function pollInterval(thread: Thread | undefined, turn: Turn | undefined, connected: boolean): number | false {
  if (!connected && turn?.status === "waiting" && !isAnswered(thread, turn)) return POLL_MS;
  const last = thread?.messages.at(-1);
  const recentWorking =
    last?.role === "ASSISTANT" &&
    last.state === "PENDING" &&
    Date.now() - Date.parse(last.createdAt) < PENDING_REPLY_WAIT_MS;
  return recentWorking ? POLL_MS : false;
}

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
      // A confirmation that expired in the queue comes back as "confirm:" with no id.
      const mine =
        !!due &&
        (due.clientRequestId === clientRequestId || (due.kind === "confirm" && clientRequestId.startsWith("confirm:")));
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

  // No reply within REPLY_WAIT_MS: say so (a job that failed for good sends nothing).
  useEffect(() => {
    if (!threadId || !turn || turn.status !== "waiting" || answered) return;
    const timer = setTimeout(
      () => patchTurn(threadId, turn.key, { status: "late" }),
      Math.max(0, turn.startedAt + REPLY_WAIT_MS - Date.now())
    );
    return () => clearTimeout(timer);
  }, [threadId, turn, answered, patchTurn]);

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
    refresh: () => void query.refetch(),
  };
}
