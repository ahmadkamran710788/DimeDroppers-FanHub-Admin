import { config } from "@/config";
import { routes } from "@/utils/routes";

export const runtime = "nodejs";

/**
 * Proxy for FanHub "Get School" (Setup Wizard — rehydrate on Back/Next).
 *
 * The browser GETs this static internal route with `?schoolId=…` (and an optional
 * `?schedule=N`); this server-only handler injects the secret `x-fanhub-key` header
 * and forwards to `/fanhub/schools/{schoolId}?schedule=N`. The key
 * (config.fanhubApiKey) is never exposed to the client bundle. `schoolId` rides in
 * the query string so the internal route can stay static.
 */
export async function GET(request: Request) {
  if (!config.fanhubApiKey) {
    return Response.json(
      { message: "Server is missing FANHUB_API_KEY configuration." },
      { status: 500 }
    );
  }
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const params = new URL(request.url).searchParams;
    const schoolId = params.get("schoolId");
    if (!schoolId) {
      return Response.json({ message: "Missing schoolId." }, { status: 400 });
    }
    const schedule = Number(params.get("schedule")) || 5;

    const upstream = await fetch(`${config.apiUrl}/${routes.api.getSchool(schoolId, schedule)}`, {
      method: "GET",
      headers: { "x-fanhub-key": config.fanhubApiKey },
    });

    // Pass the upstream JSON and status straight through to the client.
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
