import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** DELETE /api/fanhub/org/videographer-pool/:memberId — revoke an ACTIVE member (→ REVOKED) */
export async function DELETE(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return proxyToUpstream(routes.api.revokeVideographer(memberId), { method: "DELETE" });
}
