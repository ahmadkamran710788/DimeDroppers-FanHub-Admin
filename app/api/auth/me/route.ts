import { config } from "@/config";
import { upstreamFetch } from "@/utils/auth/upstream";
import type { AuthOrganization } from "@/utils/types/auth";

export const runtime = "nodejs";

/**
 * Returns the authenticated organization from the access token cookie.
 * Called by AuthProvider on mount to hydrate context after a hard-refresh.
 *
 * Forwards to the upstream `fanhub/org-auth/me` endpoint using the httpOnly
 * accessToken cookie — the client never touches the token directly.
 */
export async function GET() {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const upstream = await upstreamFetch(`${config.apiUrl}/fanhub/org-auth/me`, {
      cache: "no-store",
    });

    if (!upstream.ok) {
      return Response.json({ message: "Not authenticated." }, { status: 401 });
    }

    const body = await upstream.json().catch(() => null);
    const org = body?.data?.[0] as AuthOrganization | undefined;

    if (!org?.id) {
      return Response.json({ message: "Not authenticated." }, { status: 401 });
    }

    return Response.json({ data: org });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
