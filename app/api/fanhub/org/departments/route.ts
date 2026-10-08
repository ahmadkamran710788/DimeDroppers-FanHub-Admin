import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** GET /api/fanhub/org/departments — the org's teams, grouped by sport department. */
export async function GET() {
  return proxyToUpstream(routes.api.orgDepartments, { method: "GET" });
}
