import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** GET /api/fanhub/org/roster/players?schoolTeamId= — a team's read-only roster with each player's parents. */
export async function GET(request: Request) {
  return proxyToUpstream(routes.api.rosterPlayers, { method: "GET", search: new URL(request.url).search });
}
