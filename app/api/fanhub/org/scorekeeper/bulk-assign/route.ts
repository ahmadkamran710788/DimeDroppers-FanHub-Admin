import { config } from "@/config";
import { routes } from "@/utils/routes";
import { getAccessToken } from "@/utils/auth/cookies";

export const runtime = "nodejs";

/** PUT /api/fanhub/org/scorekeeper/bulk-assign — link a fan to the selected games */
export async function PUT(request: Request) {
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
    const upstream = await fetch(
      `${config.apiUrl}${routes.api.bulkAssignScorekeeper}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(await request.json()),
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
