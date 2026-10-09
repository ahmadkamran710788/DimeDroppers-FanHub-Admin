import { routes } from "@/utils/routes";

/**
 * Browser-side holder for the FanHub access token, so client code can call the API
 * directly with `Authorization: Bearer`.
 *
 * The tokens live in httpOnly cookies that JS cannot read. Instead, the token is fetched
 * from our own /api/auth/token route (the browser sends the cookies to it automatically)
 * and kept in memory only — not localStorage or a readable cookie — so it is gone on reload
 * and re-fetched once. The refresh token never reaches the browser.
 */

// Renew this long before `exp`, so a request never races its own expiry in flight
// (mirrors REFRESH_SKEW_SECONDS in utils/auth/upstream).
const REFRESH_SKEW_MS = 60 * 1000;

let accessToken: string | null = null;

// Single-flight: concurrent callers share one in-flight request. Kept separate so a
// forced refresh never piggybacks on a plain fetch that may return the rejected token.
let pendingToken: Promise<string | null> | null = null;
let pendingRefresh: Promise<string | null> | null = null;

// Reads `exp` without verifying the signature: it only decides *when to renew*; the API
// remains the sole judge of validity. Unparseable → treat as fresh and let the API decide.
function isFresh(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof claims?.exp !== "number") return true;
    return claims.exp * 1000 - REFRESH_SKEW_MS > Date.now();
  } catch {
    return true;
  }
}

async function load(request: Promise<Response>): Promise<string | null> {
  const res = await request;
  const json = res.ok ? await res.json().catch(() => null) : null;
  accessToken = json?.accessToken ?? null;
  return accessToken;
}

/**
 * Resolves to a usable access token, or null when there is no session.
 * `force` renews it even if it looks fresh — use it after the API rejects the token (401).
 * Rejects on a network failure.
 */
export function getAccessToken({ force = false } = {}): Promise<string | null> {
  if (force) {
    if (!pendingRefresh) {
      pendingRefresh = load(fetch(routes.api.proxyAuthRefresh, { method: "POST" }));
      void pendingRefresh.catch(() => null).finally(() => {
        pendingRefresh = null;
      });
    }
    return pendingRefresh;
  }

  if (accessToken && isFresh(accessToken)) return Promise.resolve(accessToken);

  if (!pendingToken) {
    pendingToken = load(fetch(routes.api.proxyAuthToken, { cache: "no-store" }));
    void pendingToken.catch(() => null).finally(() => {
      pendingToken = null;
    });
  }
  return pendingToken;
}

// Called on sign-out so a stale token isn't reused.
export function clearAccessToken() {
  accessToken = null;
}
