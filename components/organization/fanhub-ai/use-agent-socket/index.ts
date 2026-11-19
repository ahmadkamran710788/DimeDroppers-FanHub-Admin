"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { connectOrgSocket } from "@/utils/org-socket";
import type { AgentSocketMessage } from "@/utils/types/organiser-agent";

const NAMESPACE = "/fanhub-org";
const MESSAGE_EVENT = "fanhub:org:agent:message";

// The organiser agent's live replies (FANHUB_ORGANISER_AGENT_FRONTEND.md §6). The socket joins the
// organisation's room, so it gets the replies of every thread; `onMessage` sorts them by sessionId.
// Returns whether it's connected: while it isn't, the open thread polls instead.
export function useAgentSocket(onMessage: (message: AgentSocketMessage) => void): boolean {
  const [connected, setConnected] = useState(false);
  const handle = useEffectEvent(onMessage);

  useEffect(() => {
    const socket = connectOrgSocket(NAMESPACE);
    if (!socket) return;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on(MESSAGE_EVENT, (message: AgentSocketMessage) => handle(message));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return connected;
}
