import type { PackageTier, SponsorOrganizationType } from "@/utils/types/sponsor-packages";

// Campaign Planner (national and regional brands): POST /fanhub/sponsor-packages/plans/recommend
// (FANHUB_SPONSOR_PLAN_FRONTEND.md, with the reach, nearest stores and budget split of
// FANHUB_SPONSOR_PLAN_CHANGES_21_NOV_FRONTEND.md). Money is in cents, distances in miles.

export type PlanGoal = "BRAND_AWARENESS" | "STORE_TRAFFIC" | "COMMUNITY_GOODWILL";

// Who a line's reach counts: the school's students, the tournament event's rostered players, or (with neither)
// the organisation's Fan Hub followers. Reach is these people × 1.5 (their parents).
export type ReachBasis = "STUDENTS" | "ROSTER" | "FAN_HUB_FOLLOWERS";

// One row of the budget split: a whole state (city null) or a city, and its whole percent of the budget.
export interface SponsorPlanAllocation {
  // Two-letter code ("NC").
  state: string;
  city: string | null;
  // 1 to 100; the rows add up to 100.
  percent: number;
}

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
  // Up to 10 rows, each state or city once, adding up to 100; left out (or empty) for no split, when the
  // budget is shared between the markets by their reach.
  allocations?: SponsorPlanAllocation[];
}

// One of the sponsor's chosen stores within the radius of a line's organisation.
export interface SponsorPlanNearLocation {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  distanceMiles: number;
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
  // Fan Hub users following the organisation (organisation-wide). Not shown as reach: few follow today, so it
  // gives silly costs per fan; projectedReach is the reach.
  fanReach: number;
  // The school's students, or null.
  studentCount: number | null;
  // Players on the tournament event's teams, or null.
  rosterCount: number | null;
  // People reached: the reachBasis count × 1.5 (parents).
  projectedReach: number;
  reachBasis: ReachBasis;
  // What the package's price is counted on; null without a package.
  priceBasis: { basis: "GAMES" | "TEAMS"; quantity: number } | null;
  upcomingGameCount: number;
  // To the nearest brand location in its market; null for an event the sponsor picked.
  distanceMiles: number | null;
  // The line is an event the sponsor picked.
  sponsorPicked: boolean;
  // How many of the chosen stores are within the radius, and those stores, nearest first.
  nearLocationCount: number;
  nearLocations: SponsorPlanNearLocation[];
  // Null when the line is physical add-ons only.
  package: { tier: PackageTier; name: string; totalCents: number } | null;
  inAppInventory: string[];
  physicalAssets: { activationId: string; name: string; categoryLabel: string | null; totalCents: number }[];
  totalCents: number;
  // This line as a percent of the budget (4.2).
  shareOfBudget: number;
  // Cost per person reached; null when the reach is 0.
  costPerReachCents: number | null;
  // The AI's one-line summary.
  reason: string;
  // Short sentences the server writes from data (never the AI): the proof behind the reason.
  facts: string[];
}

export interface SponsorPlanMarket {
  // "orlando|FL"
  key: string;
  // "Orlando, FL"
  label: string;
  locationCount: number;
  organizationCount: number;
  fanReach: number;
  // Reach of the market's lines.
  projectedReach: number;
  totalCents: number;
  // Whole percent of the plan's spend.
  shareOfSpend: number;
  // What was spent here as a percent of the budget (58.5).
  shareOfBudget: number;
  // The split row's percent; null without a split.
  requestedPercent: number | null;
  // The budget × the row's percent; without a split, the market's reach-based share.
  targetCents: number;
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
    // The split as sent; [] when none.
    allocations: SponsorPlanAllocation[];
  };
  totals: {
    totalCents: number;
    budgetCents: number;
    remainingCents: number;
    organizationCount: number;
    marketCount: number;
    // Followers only (see SponsorPlanLine.fanReach): not shown.
    fanReach: number;
    costPerFanCents: number | null;
    // The lines' reach added up ("Est. reach").
    projectedReach: number;
    // Total cost ÷ total reach; null when the reach is 0.
    costPerReachCents: number | null;
    // The most one line may cost: 10% of the budget, or the cheapest offer when nothing fits under 10%. Events
    // the sponsor picked aren't capped. What the cap leaves unspent is in remainingCents.
    lineCapCents: number;
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
  | "radiusMiles"
  | "allocations";

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
    // The split, filled only when every area with stores has a percent and they add up to 100; null otherwise
    // (notes says why).
    allocations: SponsorPlanAllocation[] | null;
  };
  // Each state or city read from the brief, with how many of the sponsor's stores are in it and the percent
  // the brief gave it (or null).
  areas: { label: string; state: string; city: string | null; locationCount: number; percent: number | null }[];
  // Stores used.
  locationCount: number;
  // The fields that came from the brief.
  filled: PlanPromptField[];
  // The fields the sponsor must fill before building.
  missing: ("brandLocationIds" | "budgetCents")[];
  // Lines to show the sponsor ("You have no locations in Texas").
  notes: string[];
}
