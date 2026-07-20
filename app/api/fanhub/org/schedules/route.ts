import { config } from "@/config";
import { routes } from "@/utils/routes";
import { upstreamFetch } from "@/utils/auth/upstream";

export const runtime = "nodejs";

/** GET /api/fanhub/org/schedules — list schedules with pagination/search */
export async function GET(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const search = new URL(request.url).search;
    const upstream = await upstreamFetch(
      `${config.apiUrl}${routes.api.listSchedules}${search}`,
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

/** POST /api/fanhub/org/schedules — create a schedule item */
export async function POST(request: Request) {
  if (!config.apiUrl) {
    return Response.json(
      { message: "Server is missing NEXT_PUBLIC_API_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let upstreamBody: BodyInit;
    const upstreamHeaders: Record<string, string> = {};

    if (contentType.includes("multipart/form-data")) {
      upstreamBody = await request.formData();
      // Do NOT set Content-Type — fetch sets the multipart boundary automatically
    } else {
      upstreamBody = JSON.stringify(await request.json());
      upstreamHeaders["Content-Type"] = "application/json";
    }

    const upstream = await upstreamFetch(
      `${config.apiUrl}${routes.api.createSchedule}`,
      { method: "POST", headers: upstreamHeaders, body: upstreamBody }
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
