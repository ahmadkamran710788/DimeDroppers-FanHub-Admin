import { config } from "@/config";
import { routes } from "@/utils/routes";
import { getAccessToken } from "@/utils/auth/cookies";

export const runtime = "nodejs";

/** PATCH /api/fanhub/org/schedules/[id] — update a schedule item */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    let upstreamBody: BodyInit;
    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (contentType.includes("multipart/form-data")) {
      upstreamBody = await request.formData();
    } else {
      upstreamBody = JSON.stringify(await request.json());
      upstreamHeaders["Content-Type"] = "application/json";
    }

    const upstream = await fetch(
      `${config.apiUrl}${routes.api.updateSchedule(id)}`,
      { method: "PATCH", headers: upstreamHeaders, body: upstreamBody }
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

/** DELETE /api/fanhub/org/schedules/[id] — delete a schedule item */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const upstream = await fetch(
      `${config.apiUrl}${routes.api.deleteSchedule(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
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
