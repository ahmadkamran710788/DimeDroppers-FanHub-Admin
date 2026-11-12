import { ALL, type MultiSelectValue } from "@/components/common/multi-select";
import type { PlanGoal } from "@/utils/types/sponsor-plan";

// Campaign Planner (national and regional brands), on POST /fanhub/sponsor-packages/plans/recommend
// (FANHUB_SPONSOR_PLAN_FRONTEND.md). The seasons, sports and genders come from
// GET /fanhub/sponsor-packages/filters, the brand's locations from GET /fanhub/sponsor-profile/locations.

// The brands the planner is for (from the sponsor's brand type), shown on its tab and its pill.
export type PlannerTier = "NATIONAL" | "REGIONAL";

// The goals the API takes (GET /filters doesn't list them).
export const GOAL_OPTIONS: { label: string; value: PlanGoal }[] = [
  { label: "Brand awareness", value: "BRAND_AWARENESS" },
  { label: "Store traffic", value: "STORE_TRAFFIC" },
  { label: "Community goodwill", value: "COMMUNITY_GOODWILL" },
];

// The API's limits.
export const MIN_BUDGET_CENTS = 10_000;
export const MAX_BUDGET_CENTS = 100_000_000_000;
export const MAX_RADIUS_MILES = 250;

// The composer as typed (chip values are API codes, e.g. "FOOTBALL").
export interface PlanForm {
  // The brand's locations to plan around: ALL, or picked ids.
  stores: MultiSelectValue;
  // Whole miles around each location, as typed (digits only); the API takes 1 to 250.
  radius: string;
  // As typed ("$60,000").
  budget: string;
  // A seasons code; "" until the filters load (the first season).
  season: string;
  goal: PlanGoal;
  sports: string[];
  genders: string[];
}

export const DEFAULT_FORM: PlanForm = {
  stores: ALL,
  // The API's default radius.
  radius: "25",
  budget: "$60,000",
  season: "",
  goal: "BRAND_AWARENESS",
  sports: [],
  genders: [],
};

// The API's field names (data.errors[].path, e.g. "sports.1") → the composer field under which the message
// shows.
export const fieldOfPath = (path: string): keyof PlanForm | null => {
  const root = path.split(".")[0];
  const fields: Record<string, keyof PlanForm> = {
    brandLocationIds: "stores",
    radiusMiles: "radius",
    budgetCents: "budget",
    season: "season",
    goal: "goal",
    sports: "sports",
    genders: "genders",
  };
  return fields[root] ?? null;
};

// Value-bar colors of the plan's stat cards.
export const PLAN_STAT_TINTS = {
  cost: "#3d6f3e",
  organizations: "#3d5194",
  reach: "#5e4277",
  costPerFan: "#7a4a2e",
};
