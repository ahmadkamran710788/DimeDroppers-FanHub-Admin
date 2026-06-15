import { config } from "@/config";
import { routes } from "@/utils/routes";
import {
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/utils/auth/cookies";
import type { AuthTokens } from "@/utils/types/auth";

export const runtime = "nodejs";

/**
 * Proxy for FanHub Org Auth "Refresh".
 *
 * Reads the httpOnly refreshToken cookie, exchanges it upstream for a fresh
 * access/refresh pair, and re-sets both cookies. On upstream failure the cookies
 * are cleared so a stale session is not left behind.
 */
export async function POST() {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return Response.json({ message: "No refresh token." }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${config.apiUrl}/${routes.api.authRefresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    if (upstream.ok) {
      const tokens = body?.data?.[0] as AuthTokens | undefined;
      if (tokens?.accessToken && tokens?.refreshToken) {
        await setAuthCookies(tokens.accessToken, tokens.refreshToken);
      }
    } else {
      await clearAuthCookies();
    }

    return Response.json(body, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
