import { config } from "@/config";
import { routes } from "@/utils/routes";
import { upstreamFetch } from "@/utils/auth/upstream";

export const runtime = "nodejs";

/** POST /api/fanhub/org/scorekeeper-pool/:memberId/reject — reject a REQUESTED member */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const { memberId } = await params;
    const upstream = await upstreamFetch(
      `${config.apiUrl}${routes.api.rejectScorekeeper(memberId)}`,
      {
        method: "POST",
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
