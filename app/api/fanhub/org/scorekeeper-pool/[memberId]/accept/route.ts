import { config } from "@/config";
import { routes } from "@/utils/routes";
import { getAccessToken } from "@/utils/auth/cookies";

export const runtime = "nodejs";

/** POST /api/fanhub/org/scorekeeper-pool/:memberId/accept — accept a REQUESTED member */
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

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { memberId } = await params;
    const upstream = await fetch(
      `${config.apiUrl}${routes.api.acceptScorekeeper(memberId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
