import { config } from "@/config";
import { routes } from "@/utils/routes";
import { setAccountRoleCookie, setAuthCookies } from "@/utils/auth/cookies";
import type { AuthSession } from "@/utils/types/auth";

export const runtime = "nodejs";

/**
 * Proxy for FanHub Org Auth "Sign up" (FANHUB_ORG_SIGNUP_FRONTEND.md).
 *
 * The browser posts the whole sign-up here as multipart form data (the account,
 * the organisation and the logo file); this server-only handler forwards it
 * unchanged to the FanHub API (fetch sets the multipart boundary, so no
 * Content-Type is set here) and, on success (201), stores the returned
 * access/refresh tokens as httpOnly cookies. The API checks every field; its
 * errors are passed straight through so the client can place them under their
 * fields (e.g. 409 "An account with this email already exists").
 */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return Response.json({ message: "Send the sign-up as form data." }, { status: 400 });
    }

    const upstream = await fetch(`${config.apiUrl}/${routes.api.authSignup}`, {
      method: "POST",
      body: form,
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    if (upstream.ok) {
      const session = body?.data?.[0] as AuthSession | undefined;
      if (session?.accessToken && session?.refreshToken) {
        await setAuthCookies(session.accessToken, session.refreshToken);
        // As sign-in does, so a sponsor session from before in this browser can't keep its role.
        await setAccountRoleCookie("ORGANISER");
        // Keep the refresh token out of the browser: it lives only in its httpOnly cookie.
        return Response.json(
          { ...body, data: [{ accessToken: session.accessToken, organization: session.organization }] },
          { status: upstream.status }
        );
      }
    }

    return Response.json(body, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
