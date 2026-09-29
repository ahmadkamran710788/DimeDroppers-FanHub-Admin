import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** POST /api/fanhub/org/videographer-pool/:memberId/reject — REQUESTED → REJECTED */
export async function POST(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return proxyToUpstream(routes.api.rejectVideographer(memberId), { method: "POST" });
}
