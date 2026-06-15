import { config } from "@/config";
import { routes } from "@/utils/routes";
import { setAuthCookies } from "@/utils/auth/cookies";
import type { AuthSession } from "@/utils/types/auth";

export const runtime = "nodejs";

/**
 * Proxy for FanHub Org Auth "Sign up".
 *
 * The browser posts `{ email, name, password, phone }` here; this server-only
 * handler forwards to the FanHub API and, on success (201), stores the returned
 * access/refresh tokens as httpOnly cookies. Non-2xx upstream responses are passed
 * straight through so the client can show the backend's message (e.g. 409
 * "An account with this email already exists").
 */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const { email, name, password, phone } = (await request
      .json()
      .catch(() => ({}))) as {
      email?: string;
      name?: string;
      password?: string;
      phone?: string;
    };
    if (!email || !name || !password || !phone) {
      return Response.json(
        { message: "Email, name, password and phone are required." },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${config.apiUrl}/${routes.api.authSignup}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, phone }),
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    if (upstream.ok) {
      const session = body?.data?.[0] as AuthSession | undefined;
      if (session?.accessToken && session?.refreshToken) {
        await setAuthCookies(session.accessToken, session.refreshToken);
      }
    }

    return Response.json(body, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
