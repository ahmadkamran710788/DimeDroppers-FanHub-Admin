import { io, type Socket } from "socket.io-client";
import { config } from "@/config";
import { getAccessToken } from "@/utils/auth/client-token";

// What an org namespace answers a missing, expired or refused token with.
const UNAUTHORIZED = "Unauthorized";

// A Socket.IO connection to one of the API's organisation namespaces (e.g. /fanhub-org, /fanhub-engage-org),
// signed in with the org access token. Null without a socket host.
// - WebSocket only: the long-polling transport is held to the API's CORS origins, which the panel's preview
//   hosts aren't on.
// - The token is fetched per handshake, so a reconnect never sends a stale one; a refused token is retried
//   once with a fresh one (e.g. it expired while the tab slept).
export function connectOrgSocket(namespace: string): Socket | null {
  if (!config.socketUrl) return null;
  let forceToken = false;
  let retriedAuth = false;

  const socket = io(`${config.socketUrl}${namespace}`, {
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
  });
  socket.on("connect_error", (err) => {
    if (err.message === UNAUTHORIZED && !retriedAuth) {
      retriedAuth = true;
      forceToken = true;
      socket.connect();
    }
  });
  return socket;
}
