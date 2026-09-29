import { config } from "@/config";
import { upstreamFetch } from "@/utils/auth/upstream";

interface ProxyOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  // JSON body to forward (omit for bodyless requests).
  body?: unknown;
  // Query string to append, e.g. `new URL(request.url).search`.
  search?: string;
}

/**
 * Forwards a request from an /api/* route handler to the FanHub API as the signed-in
 * org (upstreamFetch attaches the Bearer token and refreshes it on 401), then passes the
 * upstream JSON and status straight back. `endpoint` is a `routes.api.*` path with no
 * leading slash.
 */
export async function proxyToUpstream(endpoint: string, { method, body, search = "" }: ProxyOptions) {
  if (!config.apiUrl) {
    return Response.json({ message: "Server is missing NEXT_PUBLIC_API_URL configuration." }, { status: 500 });
  }

  try {
    const upstream = await upstreamFetch(`${config.apiUrl}/${endpoint}${search}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    const json = await upstream.json().catch(() => ({ message: "Upstream returned a non-JSON response." }));
    return Response.json(json, { status: upstream.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach the FanHub API.";
    return Response.json({ message }, { status: 502 });
  }
}
