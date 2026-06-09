import { config } from "@/config";
import { routes } from "@/utils/routes";

export const runtime = "nodejs";

/**
 * Proxy for FanHub "Create School" (Setup Wizard — Step 1).
 *
 * The browser posts multipart/form-data here; this server-only handler injects the
 * secret `x-fanhub-key` header and forwards the request to the FanHub API. The key
 * (config.fanhubApiKey) is never exposed to the client bundle.
 */
export async function POST(request: Request) {
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
    // Re-read the incoming multipart body and forward it as-is. Passing the FormData
    // straight to fetch lets it set the correct multipart boundary on Content-Type —
    // so we must NOT set Content-Type manually.
    const formData = await request.formData();

    const upstream = await fetch(`${config.apiUrl}/${routes.api.createSchool}`, {
      method: "POST",
      headers: { "x-fanhub-key": config.fanhubApiKey },
      body: formData,
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
