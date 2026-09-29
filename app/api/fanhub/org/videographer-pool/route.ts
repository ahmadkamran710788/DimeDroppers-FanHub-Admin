import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** GET /api/fanhub/org/videographer-pool — list pool members (optional ?status=) */
export async function GET(request: Request) {
  return proxyToUpstream(routes.api.listVideographerPool, {
    method: "GET",
    search: new URL(request.url).search,
  });
}

/** POST /api/fanhub/org/videographer-pool — invite a fan by email. Body: { email } */
export async function POST(request: Request) {
  return proxyToUpstream(routes.api.inviteVideographer, {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
