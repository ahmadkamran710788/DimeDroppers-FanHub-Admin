import type { SponsorCartLine } from "@/utils/types/sponsor-packages";
import type { SponsorPlanLine } from "@/utils/types/sponsor-plan";

// A plan is bought with the cart's endpoints (FANHUB_SPONSOR_PLAN_CHECKOUT_FRONTEND.md §1): a line's package
// and each of its physical add-ons is one cart item, at the plan's price (`expectedTotalCents`, so a price
// changed since the plan was built is refused instead of charged). No stores are sent: a plan line doesn't
// name the brand locations near the organisation.

// One cart item from the plan, with the line it came from (so a quote's `items[i].index` points back to a row).
export interface PlanEntry {
  // The line's index in plan.lines.
  lineIndex: number;
  // What goes into the browser cart (its `item` is the activation body).
  cartLine: Omit<SponsorCartLine, "key">;
}

// A line's package (if any) and physical add-ons, as cart lines.
function lineToCartLines(line: SponsorPlanLine, currency: string): Omit<SponsorCartLine, "key">[] {
  const target = { schoolId: line.schoolId, ...(line.eventId ? { eventId: line.eventId } : {}) };
  const shown = {
    organization: { id: line.schoolId, name: line.organization.name, logoUrl: line.organization.logoUrl },
    event: line.event,
    currency,
  };
  return [
    ...(line.package
      ? [
          {
            ...shown,
            kind: "PACKAGE" as const,
            name: line.package.name,
            totalCents: line.package.totalCents,
            item: { ...target, tier: line.package.tier, expectedTotalCents: line.package.totalCents },
          },
        ]
      : []),
    ...line.physicalAssets.map((asset) => ({
      ...shown,
      kind: "PHYSICAL_ASSET" as const,
      name: asset.name,
      totalCents: asset.totalCents,
      item: { ...target, physicalAssetId: asset.activationId, expectedTotalCents: asset.totalCents },
    })),
  ];
}

// The cart items of the given lines (the ones still in the plan), in plan order.
export const planEntries = (lines: { line: SponsorPlanLine; index: number }[], currency: string): PlanEntry[] =>
  lines.flatMap(({ line, index }) =>
    lineToCartLines(line, currency).map((cartLine) => ({ lineIndex: index, cartLine }))
  );
