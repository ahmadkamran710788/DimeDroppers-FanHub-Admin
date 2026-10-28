import { GOAL_OPTIONS, SEASON_OPTIONS, SPONSOR_PROFILE, type Tier } from "@/components/sponsor/data";

// Mock data for the Campaign Planner until the Dime AI API is integrated: the plan Dime AI
// returns for the default request.

export const MARKETS = ["Jacksonville", "Orlando", "Tampa"] as const;
export type Market = (typeof MARKETS)[number];

export const MARKET_FILTERS = ["All", ...MARKETS] as const;
export type MarketFilter = (typeof MARKET_FILTERS)[number];
export const MARKET_FILTER_OPTIONS = MARKET_FILTERS.map((m) => ({ label: m, value: m }));

// In-app inventory, in the order the inventory mix lists it.
export const INVENTORY = ["Watch Live", "Predictions", "Schedule", "Quests", "Voting", "Challenges"] as const;
export type Inventory = (typeof INVENTORY)[number];

// One organization's package in the plan.
export interface Placement {
  id: number;
  org: string;
  sport: string;
  market: Market;
  tier: Tier;
  inventory: Inventory[];
  // Physical assets at the venue.
  addOns: string;
  cost: number;
  // Estimated parents reached.
  reach: number;
}

const LINES: Omit<Placement, "id">[] = [
  { org: "Riverside Prep", sport: "HS football", market: "Jacksonville", tier: "PLATINUM", inventory: ["Watch Live", "Predictions", "Schedule", "Quests"], addOns: "Fence banner ×2 · PA read", cost: 6800, reach: 5200 },
  { org: "St. Johns Bluff High School", sport: "HS basketball", market: "Jacksonville", tier: "GOLD", inventory: ["Watch Live", "Predictions", "Schedule"], addOns: "Gym wall banner", cost: 3900, reach: 3100 },
  { org: "First Coast Youth Football Classic", sport: "Youth tournament", market: "Jacksonville", tier: "PLATINUM", inventory: ["Watch Live", "Voting", "Quests", "Challenges"], addOns: "Booth · PA reads · entry banner", cost: 7200, reach: 9800 },
  { org: "Lake Conway High School", sport: "HS football", market: "Orlando", tier: "PLATINUM", inventory: ["Watch Live", "Predictions", "Schedule", "Quests"], addOns: "Scoreboard panel", cost: 6500, reach: 4900 },
  { org: "Orange Grove Academy", sport: "HS basketball", market: "Orlando", tier: "GOLD", inventory: ["Watch Live", "Predictions", "Schedule"], addOns: "Courtside banner", cost: 3600, reach: 2800 },
  { org: "Central Florida Hoops Invitational", sport: "Youth tournament", market: "Orlando", tier: "PLATINUM", inventory: ["Watch Live", "Voting", "Quests", "Challenges"], addOns: "Booth · PA reads · court decals", cost: 8400, reach: 11400 },
  { org: "Bayshore High School", sport: "HS football", market: "Tampa", tier: "PLATINUM", inventory: ["Watch Live", "Predictions", "Schedule", "Quests"], addOns: "Fence banner ×2", cost: 6900, reach: 5400 },
  { org: "Hillsborough Heights High School", sport: "HS basketball", market: "Tampa", tier: "GOLD", inventory: ["Watch Live", "Predictions", "Voting"], addOns: "Gym wall banner", cost: 3700, reach: 3000 },
  { org: "Gulf Coast 7v7 Showcase", sport: "Youth tournament", market: "Tampa", tier: "GOLD", inventory: ["Watch Live", "Voting", "Quests"], addOns: "Booth · PA reads", cost: 5200, reach: 7600 },
];

export const PLACEMENTS: Placement[] = LINES.map((line, id) => ({ id, ...line }));

export const PLAN = {
  title: "Florida Friday Nights · 3-market awareness",
  rationale:
    "I picked one football program, one basketball program and one large youth tournament in each city. Tournaments carry the most parent reach, so they get Platinum packages with booths and PA reads. High school placements lean on Watch Live and Predictions, which fans use every game day.",
};

// Value-bar colors of the plan's stat cards.
export const PLAN_STAT_TINTS = {
  cost: "#3d6f3e",
  organizations: "#3d5194",
  reach: "#5e4277",
  costPerParent: "#7a4a2e",
};

// Refinements offered under the composer; picking one adds it to the description.
export const SUGGESTIONS = ["Add soccer in Tampa", "More Watch Live, fewer banners", "Cut the budget to $40,000"];

// Longest campaign description Dime AI takes.
export const PROMPT_MAX_LENGTH = 1000;

// What the sponsor asks Dime AI for, as typed into the composer.
export interface CampaignRequest {
  prompt: string;
  budget: string;
  season: string;
  goal: string;
}

export const DEFAULT_REQUEST: CampaignRequest = {
  prompt: `Build a regional brand awareness campaign for ${SPONSOR_PROFILE.name} across Jacksonville, Orlando and Tampa. Prioritize high school football, basketball and large youth tournaments with strong parent reach.`,
  budget: "$60,000",
  season: SEASON_OPTIONS[0].value,
  goal: GOAL_OPTIONS[0].value,
};
