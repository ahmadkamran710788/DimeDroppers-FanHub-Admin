import { config } from "@/config";
import { routes } from "@/utils/routes";

export const runtime = "nodejs";

/**
 * Proxy for FanHub "Update Feature Links" (Setup Wizard — Step 3 "Choose Activations").
 *
 * The browser PATCHes `{ schoolId, ...featureLinks }` here; this server-only handler
 * injects the secret `x-fanhub-key` header and forwards the remaining link fields to the
 * FanHub API at `/fanhub/schools/{schoolId}/feature-links`. The key (config.fanhubApiKey)
 * is never exposed to the client bundle. `schoolId` is carried in the body so the
 * internal route can stay static.
 */
export async function PATCH(request: Request) {
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
    const { schoolId, ...links } = (await request.json().catch(() => ({}))) as {
      schoolId?: string;
      [key: string]: unknown;
    };
    if (!schoolId) {
      return Response.json({ message: "Missing schoolId." }, { status: 400 });
    }

    const upstream = await fetch(`${config.apiUrl}/${routes.api.featureLinks(schoolId)}`, {
      method: "PATCH",
      headers: {
        "x-fanhub-key": config.fanhubApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(links),
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
