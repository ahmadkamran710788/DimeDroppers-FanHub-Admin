import { config } from "@/config";
import { routes } from "@/utils/routes";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The logo kinds' file types (FANHUB_SPONSOR_BRAND_ASSETS_FRONTEND.md); anything else isn't passed on.
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

const TIMEOUT_MS = 10_000;

/**
 * One sponsor logo's file, for the Brand Assets logo editor. The logo's link redirects to a signed S3 link,
 * which the browser may not read into a canvas (no CORS), so this server-only handler follows it and answers the
 * image same-origin. Only a logo id is taken, and the URL is built from the API's base, so it's no open proxy.
 * The link is public (no token), like the `url` the panel already shows.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/sponsor-logos/[assetId]">) {
  const { assetId } = await params;
  if (!UUID.test(assetId)) return Response.json({ message: "Unknown logo" }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}/${routes.api.sponsorLogoLink(assetId)}`, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return Response.json({ message: "Couldn't reach the logo" }, { status: 502 });
  }
  if (!res.ok) return Response.json({ message: "Couldn't load the logo" }, { status: res.status === 404 ? 404 : 502 });

  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!IMAGE_TYPES.includes(type)) return Response.json({ message: "The logo isn't an image" }, { status: 502 });

  return new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
}
