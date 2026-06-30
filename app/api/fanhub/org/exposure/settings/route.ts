import { config } from "@/config";
import { routes } from "@/utils/routes";
import { getAccessToken } from "@/utils/auth/cookies";

export const runtime = "nodejs";

/** POST /api/fanhub/org/exposure/settings — save Exposure API key + secret */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const upstream = await fetch(`${config.apiUrl}${routes.api.exposureSettings}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    // Pass the upstream status + body through unchanged so the client can surface
    // the exact 403 "available only for tournament organizations" message.
    return Response.json(body, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
