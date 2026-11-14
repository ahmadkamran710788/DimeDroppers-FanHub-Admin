import type { PackageTier, SponsorOrganizationType } from "@/utils/types/sponsor-packages";

// Campaign Planner (national and regional brands): POST /fanhub/sponsor-packages/plans/recommend
// (FANHUB_SPONSOR_PLAN_FRONTEND.md). Money is in cents, distances in miles.

export type PlanGoal = "BRAND_AWARENESS" | "STORE_TRAFFIC" | "COMMUNITY_GOODWILL";

export interface SponsorPlanRequest {
  // "ALL", or up to 50 of the sponsor's location ids.
  brandLocationIds: "ALL" | string[];
  radiusMiles: number;
  // At least 10000 ($100).
  budgetCents: number;
  // A seasons code from GET /filters (FALL_WINTER…); left out for any season.
  season?: string;
  goal: PlanGoal;
  // Sports / genders codes from GET /filters; left out for all.
  sports?: string[];
  genders?: string[];
  // Up to 10 offered tournament event ids, put in the plan when the budget allows.
  eventIds?: string[];
}

export interface SponsorPlanLine {
  schoolId: string;
  // Set for a tournament's event line; null for schools, clubs and leagues.
  eventId: string | null;
  organization: {
    id: string;
    name: string;
    organizationType: SponsorOrganizationType;
    organizationTypeLabel: string;
    logoUrl: string | null;
    city: string | null;
    state: string | null;
  };
  event: { id: string; name: string | null } | null;
  market: { key: string; label: string };
  // Display labels ("Football").
  sports: string[];
  // Fan Hub users following the organisation (organisation-wide).
  fanReach: number;
  upcomingGameCount: number;
  // To the nearest brand location in its market; null for an event the sponsor picked.
  distanceMiles: number | null;
  // The line is an event the sponsor picked.
  sponsorPicked: boolean;
  // Null when the line is physical add-ons only.
  package: { tier: PackageTier; name: string; totalCents: number } | null;
  inAppInventory: string[];
  physicalAssets: { activationId: string; name: string; categoryLabel: string | null; totalCents: number }[];
  totalCents: number;
  reason: string;
}

export interface SponsorPlanMarket {
  // "orlando|FL"
  key: string;
  // "Orlando, FL"
  label: string;
  locationCount: number;
  organizationCount: number;
  fanReach: number;
  totalCents: number;
  // Whole percent of the plan's spend.
  shareOfSpend: number;
}

export interface SponsorPlan {
  // FALLBACK: built without the AI (best fan reach per dollar).
  source: "AI" | "FALLBACK";
  title: string;
  summary: string;
  input: {
    goal: PlanGoal;
    season: string | null;
    budgetCents: number;
    radiusMiles: number;
    eventIds: string[];
  };
  totals: {
    totalCents: number;
    budgetCents: number;
    remainingCents: number;
    organizationCount: number;
    marketCount: number;
    fanReach: number;
    // Null when the fan reach is 0.
    costPerFanCents: number | null;
  };
  // Markets with at least one line.
  markets: SponsorPlanMarket[];
  // Brand-location markets past the 10 that are searched.
  skippedMarketCount: number;
  lines: SponsorPlanLine[];
  // Per in-app slot, how many lines' packages include it (top 8).
  inventoryMix: { name: string; lineCount: number }[];
  currency: "USD";
}

// Prompt mode: POST /fanhub/sponsor-packages/plans/prompt reads a brief into the planner's form
// (FANHUB_SPONSOR_PLAN_FRONTEND.md §6).
export type PlanPromptField =
  | "brandLocationIds"
  | "budgetCents"
  | "season"
  | "goal"
  | "sports"
  | "genders"
  | "radiusMiles";

export interface SponsorPlanPromptResult {
  // The body for POST /plans/recommend; null means the brief didn't give it.
  form: {
    // Up to 50 store ids; "ALL" when no place was named or the places cover every store; null when no store matched.
    brandLocationIds: string[] | "ALL" | null;
    radiusMiles: number;
    eventIds: string[];
    budgetCents: number | null;
    // A seasons code (FALL_WINTER…).
    season: string | null;
    goal: PlanGoal;
    // Codes ("FOOTBALL", "BOYS").
    sports: string[];
    genders: string[];
  };
  // Each state or city read from the brief, with how many of the sponsor's stores are in it.
  areas: { label: string; state: string; city: string | null; locationCount: number }[];
  // Stores used.
  locationCount: number;
  // The fields that came from the brief.
  filled: PlanPromptField[];
  // The fields the sponsor must fill before building.
  missing: ("brandLocationIds" | "budgetCents")[];
  // Lines to show the sponsor ("You have no locations in Texas").
  notes: string[];
}
