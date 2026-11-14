import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import { citiesOf } from "@/utils/us-places";

export const runtime = "nodejs";
// Only the states below; any other code is a 404.
export const dynamicParams = false;

// Built once per state at build time (the list never changes between deploys), so the 5 MB ZIP list is only
// read while building.
export function generateStaticParams() {
  return US_STATE_OPTIONS.map((option) => ({ state: option.value }));
}

/**
 * Every city of a US state, A to Z, for the Fetch locations picker on the sponsor profile.
 * Response: `{ state: "TX", cities: ["Abbott", …] }`.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/us-places/cities/[state]">) {
  const { state } = await params;
  return Response.json({ state, cities: citiesOf(state) });
}
