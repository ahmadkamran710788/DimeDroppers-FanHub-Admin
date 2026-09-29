import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** GET /api/fanhub/org/videographer-requests — review queue (?status=PENDING|ACCEPTED|REJECTED, ?page, ?limit) */
export async function GET(request: Request) {
  return proxyToUpstream(routes.api.listVideographerRequests, {
    method: "GET",
    search: new URL(request.url).search,
  });
}
