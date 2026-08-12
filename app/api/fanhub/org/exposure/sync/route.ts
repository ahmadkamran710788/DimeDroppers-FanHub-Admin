import { config } from "@/config";
import { routes } from "@/utils/routes";
import { upstreamFetch } from "@/utils/auth/upstream";

export const runtime = "nodejs";

/** POST /api/fanhub/org/exposure/sync — trigger an Exposure sync */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    // Forwarding a JSON body is required, not cosmetic: this handler used to send a
    // bodyless POST with no Content-Type, which reached the upstream schema as
    // `undefined` and failed root-level validation with { path: "", message: "Required" }.
    // Default to {} so a client that sends nothing still produces a valid object, and
    // keep it a serialized string — `upstreamFetch` replays this init on its 401 retry,
    // which a consumed request stream could not survive.
    const payload = await request.json().catch(() => ({}));

    const upstream = await upstreamFetch(`${config.apiUrl}${routes.api.exposureSync}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await upstream.json().catch(() => ({
      message: "Upstream returned a non-JSON response.",
    }));

    return Response.json(body, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
