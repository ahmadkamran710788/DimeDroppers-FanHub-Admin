import {
  ORGANIZATIONS,
  PACKAGE_SLOTS,
  type OrgSearch,
  type Organization,
  type SortOption,
} from "@/components/sponsor/find-organizations/data";
import type { Tier } from "@/components/sponsor/data";

// True when nothing is picked, or the organization offers at least one pick.
const anyOf = <T>(picked: readonly T[], offered: readonly T[]) =>
  picked.length === 0 || picked.some((p) => offered.includes(p));

// Mock stand-in for the organization search endpoint; replace it with the API call. An organization
// matches when it's inside the radius and has any picked sport, in-app item and venue item. The mock
// distances are all measured from Twin Lakes, so the location itself isn't used.
export function searchOrganizations(search: OrgSearch): Organization[] {
  return ORGANIZATIONS.filter(
    (o) =>
      o.distance <= Number(search.radius) &&
      anyOf(search.sports, o.sports) &&
      anyOf(search.inApp, o.inApp) &&
      anyOf(search.venue, o.venue)
  );
}

// The cheapest package's price ("from $350").
export const fromPrice = (org: Organization) => Math.min(...org.prices);

const COMPARE: Record<SortOption, (a: Organization, b: Organization) => number> = {
  Nearest: (a, b) => a.distance - b.distance,
  "Largest fan reach": (a, b) => b.reach - a.reach,
  "Lowest price": (a, b) => fromPrice(a) - fromPrice(b),
};

export const sortOrganizations = (orgs: Organization[], sort: SortOption) => [...orgs].sort(COMPARE[sort]);

// A tier's placements that the organization offers.
export const packageSlots = (org: Organization, tier: Tier) =>
  PACKAGE_SLOTS[tier].filter((s) => org.inApp.includes(s.place));
