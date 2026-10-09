import { getAccessToken } from "@/utils/auth/cookies";
import { isExpiringSoon, refreshAccessToken } from "@/utils/auth/upstream";

export const runtime = "nodejs";

/**
 * Hands the browser a usable access token so it can call the FanHub API directly.
 *
 * The tokens live in httpOnly cookies that client JS cannot read, but the browser still
 * sends them to this same-origin route. It returns the current access token, renewing it
 * first (via the httpOnly refresh token) if it is missing or about to expire. Only the
 * short-lived access token leaves the server; the refresh token never does.
 *
 * Other sites can't use this to read the token: the cookies are SameSite=Lax (not sent on
 * cross-site fetches) and the route sends no CORS headers.
 */
export async function GET() {
  let token = await getAccessToken();

  // Same fallback as upstreamFetch: if a renewal fails (e.g. a network blip), the old
  // token may still have seconds left; the backend stays the judge of whether it's valid.
  if (!token || isExpiringSoon(token)) {
    token = (await refreshAccessToken()) ?? token;
  }
  if (!token) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  return Response.json(
    { accessToken: token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
