import { config } from "@/config";
import { routes } from "@/utils/routes";
import { setAuthCookies } from "@/utils/auth/cookies";
import type { AuthSession } from "@/utils/types/auth";

export const runtime = "nodejs";

/**
 * Proxy for FanHub Org Auth "Sign in".
 *
 * The browser posts `{ email, password }` here; this server-only handler forwards
 * to the FanHub API and, on success, stores the returned access/refresh tokens as
 * httpOnly cookies (so the refresh token is never exposed to the client bundle).
 * Non-2xx upstream responses are passed straight through so the client can show
 * the backend's message (e.g. 401 "Invalid email or password").
 */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const { email, password } = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${config.apiUrl}/${routes.api.authSignin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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
