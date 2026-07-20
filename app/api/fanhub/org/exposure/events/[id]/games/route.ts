import { config } from "@/config";
import { routes } from "@/utils/routes";
import { upstreamFetch } from "@/utils/auth/upstream";

export const runtime = "nodejs";

/** GET /api/fanhub/org/exposure/events/:id/games — game schedule for an event */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const { id } = await params;
    const search = new URL(request.url).search;
    const upstream = await upstreamFetch(
      `${config.apiUrl}${routes.api.exposureEventGames(id)}${search}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

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
