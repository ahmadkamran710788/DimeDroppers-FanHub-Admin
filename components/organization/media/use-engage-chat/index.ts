"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { connectOrgSocket } from "@/utils/org-socket";

// One public Engage Live message (history row or live broadcast).
export interface EngageMessage {
  id: string;
  scheduleEventId: string;
  fanId: string;
  body: string;
  createdAt: string;
  fan: { id: string; name: string; email: string } | null;
}

type Ack<T> = ({ ok: true } & T) | { ok: false; error: string };

const NAMESPACE = "/fanhub-engage-org";
const PAGE = 50;
const CONNECT_ERROR = "Couldn't connect to the chat.";

// The org's read-only view of a game's public Engage Live chat (socket namespace /fanhub-engage-org):
// joins the game, reads the newest page of history, then appends fans' messages as they're posted.
// `messages` run oldest → newest; `loadOlder` pages further back. Nothing can be sent. Mount it per game
// (key it by the game id), so each game starts empty.
export function useEngageChat(gameId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<EngageMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const socket = connectOrgSocket(NAMESPACE);
    socketRef.current = socket;
    if (!socket) {
      // Reported from a callback, not straight from the effect.
      queueMicrotask(() => {
        if (cancelled) return;
        setError(CONNECT_ERROR);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    // On every (re)connect: join the game and read the newest page; live messages that came in meanwhile stay.
    socket.on("connect", async () => {
      const join = (await socket.emitWithAck("fanhub:engage:joinGame", { gameid: gameId })) as Ack<{ joined: boolean }>;
      if (cancelled) return;
      if (!join.ok) {
        setError(join.error);
        setLoading(false);
        return;
      }
      const first = (await socket.emitWithAck("fanhub:engage:getPublicMessages", { gameid: gameId, limit: PAGE })) as Ack<{
        messages: EngageMessage[];
      }>;
      if (cancelled) return;
      if (first.ok) {
        // History comes newest first.
        const history = [...first.messages].reverse();
        setMessages((live) => [...history, ...live.filter((m) => !history.some((h) => h.id === m.id))]);
        setHasMore(first.messages.length === PAGE);
        setError(null);
      } else setError(first.error);
      setLoading(false);
    });
    socket.on("fanhub:engage:publicMessage", (m: EngageMessage) => {
      if (m.scheduleEventId !== gameId) return;
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
    });
    // The helper retries a refused token once by itself; anything else (or a second refusal) is shown.
    socket.on("connect_error", () => {
      if (cancelled || socket.active) return;
      setError(CONNECT_ERROR);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (socket.connected) socket.emit("fanhub:engage:leaveGame", { gameid: gameId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId]);

  const loadOlder = useCallback(async () => {
    const socket = socketRef.current;
    const oldest = messages[0];
    if (!socket?.connected || !oldest || loadingOlder) return;
    setLoadingOlder(true);
    const page = (await socket.emitWithAck("fanhub:engage:getPublicMessages", {
      gameid: gameId,
      before: oldest.id,
      limit: PAGE,
    })) as Ack<{ messages: EngageMessage[] }>;
    if (page.ok) {
      setMessages((prev) => [...[...page.messages].reverse(), ...prev]);
      setHasMore(page.messages.length === PAGE);
    }
    setLoadingOlder(false);
  }, [gameId, messages, loadingOlder]);

  return { messages, loading, error, hasMore, loadingOlder, loadOlder };
}
