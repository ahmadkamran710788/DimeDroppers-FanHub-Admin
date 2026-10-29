import { config } from "@/config";
import { routes } from "@/utils/routes";
import { setAccountRoleCookie, setAuthCookies } from "@/utils/auth/cookies";
import type { AuthSession } from "@/utils/types/auth";
import type { SponsorProfileView } from "@/utils/types/sponsor-profile";

export const runtime = "nodejs";

/**
 * Proxy for FanHub "Sponsor sign-up".
 *
 * The browser posts the whole wizard here as multipart (account, brand, logo, acceptTerms); this
 * server-only handler forwards it to the FanHub API and, on success (201), stores the returned
 * access/refresh tokens as httpOnly cookies with the SPONSOR role (proxy.ts keeps the sponsor on
 * /sponsor/* by it). Non-2xx upstream responses are passed straight through so the client can show
 * the backend's message under the right field (e.g. 409 "An account with this email already exists").
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
      return Response.json({ message: "Send the sign-up form as multipart." }, { status: 400 });
    }

    // No Content-Type: fetch sets multipart/form-data with its boundary from the FormData.
    const upstream = await fetch(`${config.apiUrl}/${routes.api.sponsorSignup}`, {
      method: "POST",
      body: form,
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    if (upstream.ok) {
      const session = body?.data?.[0] as
        | (Pick<AuthSession, "accessToken" | "refreshToken"> & { sponsor?: SponsorProfileView })
        | undefined;
      if (session?.accessToken && session?.refreshToken) {
        await setAuthCookies(session.accessToken, session.refreshToken);
        await setAccountRoleCookie("SPONSOR");
        // Keep the refresh token out of the browser: it lives only in its httpOnly cookie.
        return Response.json(
          { ...body, data: [{ accessToken: session.accessToken, role: "SPONSOR", sponsor: session.sponsor }] },
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
