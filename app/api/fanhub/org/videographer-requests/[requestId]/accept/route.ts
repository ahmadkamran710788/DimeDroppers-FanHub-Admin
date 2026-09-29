import { routes } from "@/utils/routes";
import { proxyToUpstream } from "@/utils/api-proxy";

export const runtime = "nodejs";

/** POST /api/fanhub/org/videographer-requests/:requestId/accept — Body: { reviewNote? } */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return proxyToUpstream(routes.api.acceptVideographerRequest(requestId), {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
