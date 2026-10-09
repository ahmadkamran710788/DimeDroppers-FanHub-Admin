import { config } from "@/config";
import { routes } from "@/utils/routes";
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/utils/auth/cookies";
import type { AuthTokens } from "@/utils/types/auth";

/**
 * Authenticated fetch to the FanHub API that keeps the session alive on its own.
 *
 * The upstream access token is short-lived (60 min) while the refresh token lasts
 * 30 days. Rather than making expiry the user's problem, every protected route
 * handler goes through here, and the access token is renewed transparently:
 *
 *   1. Proactively — if the token is missing, or its `exp` is inside the skew
 *      window, refresh before spending a round-trip on a request we know will 401.
 *   2. Reactively — if upstream returns 401 anyway (early revocation, clock skew),
 *      refresh once and retry once.
 *
 * Returns a `Response` in every case, including auth failure (a synthesized 401),
 * so callers can keep passing `upstream.status` straight through.
 *
 * Requires the Node.js runtime (uses `Buffer`) — every caller already declares
 * `export const runtime = "nodejs"`. Cookie writes mean this is usable from Route
 * Handlers only, never from a Server Component.
 */

// Renew this many seconds before the token actually expires, so a request never
// races its own expiry in flight.
const REFRESH_SKEW_SECONDS = 60;

const unauthorized = () =>
  Response.json({ message: "Unauthorized." }, { status: 401 });

/**
 * Reads the `exp` claim without verifying the signature. That is safe here because
 * the claim only decides *when to refresh* — upstream remains the sole authority on
 * whether a token is actually valid.
 */
export function isExpiringSoon(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims?.exp !== "number") return false;
    return claims.exp - REFRESH_SKEW_SECONDS <= Math.floor(Date.now() / 1000);
  } catch {
    // Unparseable token — let upstream be the judge rather than guessing.
    return false;
  }
}

/**
 * Exchanges the refresh token for a new pair and stores both.
 *
 * Returns the new access token, or null if the session is genuinely over. No
 * locking: the backend keeps the previous refresh token valid after rotation, so
 * concurrent handlers refreshing at once cannot invalidate each other.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  let upstream: Response;
  try {
    upstream = await fetch(`${config.apiUrl}/${routes.api.authRefresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // Network blip, not a dead session — leave the cookies alone so the next
    // attempt can recover instead of forcing a sign-in.
    return null;
  }

  if (!upstream.ok) {
    await clearAuthCookies();
    return null;
  }

  const body = await upstream.json().catch(() => null);
  const tokens = body?.data?.[0] as AuthTokens | undefined;
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    await clearAuthCookies();
    return null;
  }

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

function callUpstream(url: string, init: RequestInit, token: string) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function upstreamFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  let token = await getAccessToken();

  if (!token || isExpiringSoon(token)) {
    token = (await refreshAccessToken()) ?? token;
  }
  if (!token) return unauthorized();

  const response = await callUpstream(url, init, token);
  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
  if (!refreshed) return unauthorized();

  // Safe to replay: callers pass `body` as a string or FormData, never a stream,
  // so it has not been consumed by the first attempt.
  return callUpstream(url, init, refreshed);
}
