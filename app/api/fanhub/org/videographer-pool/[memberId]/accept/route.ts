import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** POST /api/fanhub/org/videographer-pool/:memberId/accept — REQUESTED → ACTIVE */
export async function POST(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return proxyToUpstream(routes.api.acceptVideographer(memberId), { method: "POST" });
}
