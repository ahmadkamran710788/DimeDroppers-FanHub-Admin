"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { io } from "socket.io-client";
import { config } from "@/config";
import { getAccessToken } from "@/utils/auth/client-token";
import type { AgentSocketMessage } from "@/utils/types/organiser-agent";

const NAMESPACE = "/fanhub-org";
const MESSAGE_EVENT = "fanhub:org:agent:message";
// What the namespace answers a missing, expired or refused token with.
const UNAUTHORIZED = "Unauthorized";

// The organiser agent's live replies (FANHUB_ORGANISER_AGENT_FRONTEND.md §6). The socket joins the
// organisation's room, so it gets the replies of every thread; `onMessage` sorts them by sessionId.
// Returns whether it's connected: while it isn't, the open thread polls instead.
export function useAgentSocket(onMessage: (message: AgentSocketMessage) => void): boolean {
  const [connected, setConnected] = useState(false);
  const handle = useEffectEvent(onMessage);

  useEffect(() => {
    if (!config.socketUrl) return;
    // After a refused token, the next handshake fetches a fresh one, once per refusal in a row.
    let forceToken = false;
    let retriedAuth = false;

    const socket = io(`${config.socketUrl}${NAMESPACE}`, {
      // WebSocket only: the long-polling transport is held to the API's CORS origins, which the panel's
      // preview hosts aren't on. The token is fetched per handshake, so a reconnect never sends a stale one.
      transports: ["websocket"],
      auth: (cb) => {
        const force = forceToken;
        forceToken = false;
        getAccessToken({ force }).then(
          (token) => cb({ token }),
          () => cb({ token: null })
        );
      },
    });

    socket.on("connect", () => {
      retriedAuth = false;
      setConnected(true);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      setConnected(false);
      // A refused token stops the reconnects; try once more with a fresh one (e.g. it expired while asleep).
      if (err.message === UNAUTHORIZED && !retriedAuth) {
        retriedAuth = true;
        forceToken = true;
        socket.connect();
      }
    });
    socket.on(MESSAGE_EVENT, (message: AgentSocketMessage) => handle(message));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return connected;
}
