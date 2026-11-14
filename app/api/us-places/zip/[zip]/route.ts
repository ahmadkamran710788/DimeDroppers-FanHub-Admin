import { placeOfZip } from "@/utils/us-places";

export const runtime = "nodejs";

/**
 * The city and state of a 5-digit US ZIP code, shown beside a ZIP code in the Fetch locations picker.
 * Response: `{ zip: "33801", city: "Lakeland", state: "FL" }`; 404 when the ZIP list doesn't have it, 400 when
 * it isn't 5 digits.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/us-places/zip/[zip]">) {
  const { zip } = await params;
  if (!/^\d{5}$/.test(zip)) {
    return Response.json({ message: "Enter a 5-digit US ZIP code" }, { status: 400 });
  }
  const place = placeOfZip(zip);
  if (!place) return Response.json({ message: "ZIP code not found" }, { status: 404 });
  // The same ZIP code always answers the same: browsers keep it for a day.
  return Response.json(place, { headers: { "Cache-Control": "public, max-age=86400" } });
}
