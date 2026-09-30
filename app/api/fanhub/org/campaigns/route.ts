import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/**
 * POST /api/fanhub/org/campaigns — create a fundraising campaign.
 * Body: { title, description?, goalAmount, endDate, sponsorName?, teamId }
 */
export async function POST(request: Request) {
  return proxyToUpstream(routes.api.createCampaign, {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
