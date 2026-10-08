import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** GET /api/fanhub/org/roster/staff?schoolTeamId= — a team's staff list. */
export async function GET(request: Request) {
  return proxyToUpstream(routes.api.rosterStaff, { method: "GET", search: new URL(request.url).search });
}

/**
 * POST /api/fanhub/org/roster/staff — add a Head or Assistant Coach to a team.
 * Body: { schoolTeamId, role: "HEAD_COACH" | "ASSISTANT_COACH", firstName, lastName?, email, phone? }
 */
export async function POST(request: Request) {
  return proxyToUpstream(routes.api.rosterStaff, {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
