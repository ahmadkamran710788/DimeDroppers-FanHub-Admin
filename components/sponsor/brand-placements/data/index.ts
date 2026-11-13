import type { ActivationCategory } from "@/utils/types/activations";
import type { TemplateId } from "@/components/sponsor/brand-placements/purchased-inventory/data";

// Mock data for Brand Placements until the placements and performance APIs exist. Only Purchased
// Inventory is live.

export const PLACEMENTS_TABS = ["setup", "performance"] as const;
export type PlacementsTab = (typeof PLACEMENTS_TABS)[number];

export const PLACEMENTS_TAB_LABELS: Record<PlacementsTab, string> = {
  setup: "Set up placements",
  performance: "Performance",
};

// The logo versions a slot's screen calls for: the spec and the sample slots that use each one.
export const LOGO_VARIANT_DETAILS = {
  FULL_COLOR: { spec: "Horizontal · for light screens · SVG or PNG, at least 600×200", usedOn: ["Schedule"] },
  WHITE: { spec: "White on transparent · for dark screens · SVG or PNG", usedOn: ["Live Vote", "Scoreboard"] },
  ICON: { spec: "Square · for small spots · PNG, at least 512×512", usedOn: ["Predictions", "Challenges & Quests"] },
} as const;

// Logo variant uploads: PNG or SVG.
export const LOGO_ACCEPT = ".png,.svg";
export const LOGO_EXTENSIONS = ["png", "svg"];

// A template's chip (setup history, org rows) and its color in the weekly chart and legend.
export const TEMPLATE_CHIP: Record<TemplateId, string> = {
  SIMPLE_BPA: "bg-[#2a2459] text-[#ddd6fe]",
  VISIT_WEBSITE: "bg-[#172554] text-[#bfdbfe]",
  SURVEY: "bg-[#052e16] text-[#bbf7d0]",
  OFFER_PROMO_CODE: "bg-[#431407] text-[#fed7aa]",
};

export const TEMPLATE_BAR: Record<TemplateId, string> = {
  SIMPLE_BPA: "bg-[#7c6cff]",
  VISIT_WEBSITE: "bg-[#3b82f6]",
  SURVEY: "bg-[#22c55e]",
  OFFER_PROMO_CODE: "bg-[#f97316]",
};

export interface SampleOrg {
  id: string;
  name: string;
  short: string;
  meta: string;
  pkg: string;
}

export interface SampleInventory {
  id: string;
  name: string;
  category: ActivationCategory;
  // The category as the chips show it ("PRE GAME").
  phase: string;
  orgs: string[];
}

export const SAMPLE_ORGS: Record<string, SampleOrg> = {
  o1: { id: "o1", name: "21st Century Charter School", short: "21st Century", meta: "School · Gary, IN · Volleyball", pkg: "Fan Engagement Partner" },
  o2: { id: "o2", name: "Abbeville High School", short: "Abbeville", meta: "School · Abbeville, SC · Football", pkg: "Fan Engagement Partner" },
  o3: { id: "o3", name: "Abbotsford Middle/Senior High", short: "Abbotsford", meta: "School · Abbotsford, WI · Volleyball", pkg: "Fan Engagement Partner" },
  o4: { id: "o4", name: "North Florida Hoop Group", short: "North Florida", meta: "Tournament · Jacksonville, FL · Basketball", pkg: "Presenting / Category Partner" },
};

export const SAMPLE_INVENTORY: SampleInventory[] = [
  { id: "pred", name: "Predictions", category: "PRE_GAME", phase: "PRE GAME", orgs: ["o1", "o2", "o3"] },
  { id: "vote", name: "Live Vote", category: "LIVE", phase: "LIVE", orgs: ["o1", "o2"] },
  { id: "quest", name: "Challenges & Quests", category: "ADD_ON", phase: "ADD-ONS", orgs: ["o1"] },
  { id: "score", name: "Scoreboard", category: "LIVE", phase: "LIVE", orgs: ["o4"] },
  { id: "sched", name: "Schedule", category: "PRE_GAME", phase: "PRE GAME", orgs: ["o4"] },
];

// A slot is an inventory at an organization: "<org>:<inventory>".
export const slotKey = (orgId: string, inventoryId: string) => `${orgId}:${inventoryId}`;

export interface SlotSeed {
  // Fans who saw the slot in 30 days.
  fans: number;
  viewsPerFan: number;
  // Share of those fans who act, by template.
  clickRate: number;
  surveyRate: number;
  offerRate: number;
}

const seed = (fans: number, viewsPerFan: number, clickRate: number, surveyRate: number, offerRate: number): SlotSeed => ({
  fans,
  viewsPerFan,
  clickRate,
  surveyRate,
  offerRate,
});

export const SLOT_SEEDS: Record<string, SlotSeed> = {
  "o1:pred": seed(3420, 1.7, 0.046, 0.118, 0.022),
  "o2:pred": seed(5180, 2.1, 0.038, 0.094, 0.018),
  "o3:pred": seed(1960, 1.5, 0.051, 0.132, 0.025),
  "o1:vote": seed(2875, 2.4, 0.033, 0.087, 0.016),
  "o2:vote": seed(4310, 2.6, 0.041, 0.101, 0.021),
  "o1:quest": seed(1240, 3.2, 0.062, 0.141, 0.029),
  "o4:score": seed(8650, 4.8, 0.029, 0.071, 0.012),
  "o4:sched": seed(6120, 2.2, 0.044, 0.089, 0.019),
};

export const DEFAULT_SEED = seed(1000, 2, 0.04, 0.1, 0.02);

// Sample dates: the season start (when every slot was bought) and "today", fixed so the numbers stay put.
export const SEASON_START = "2026-08-15";
export const SAMPLE_TODAY = "2026-11-10";

export interface SetupPeriod {
  template: TemplateId;
  // ISO date the setup started.
  from: string;
}

// Slots whose setup changed during the season; every other slot has been Simple BPA since it was bought.
export const SETUP_HISTORY: Record<string, SetupPeriod[]> = {
  "o3:pred": [
    { template: "SURVEY", from: "2026-08-15" },
    { template: "SIMPLE_BPA", from: "2026-10-13" },
  ],
  "o2:vote": [
    { template: "VISIT_WEBSITE", from: "2026-08-15" },
    { template: "SIMPLE_BPA", from: "2026-10-25" },
  ],
  "o4:score": [
    { template: "OFFER_PROMO_CODE", from: "2026-08-15" },
    { template: "SURVEY", from: "2026-09-20" },
    { template: "SIMPLE_BPA", from: "2026-10-28" },
  ],
};

export const historyOf = (key: string): SetupPeriod[] =>
  SETUP_HISTORY[key] ?? [{ template: "SIMPLE_BPA", from: SEASON_START }];

// Every sample slot with its current template.
export const SAMPLE_SLOTS = SAMPLE_INVENTORY.flatMap((inv) =>
  inv.orgs.map((orgId) => {
    const key = slotKey(orgId, inv.id);
    const history = historyOf(key);
    return { key, orgId, inventoryId: inv.id, template: history[history.length - 1].template };
  })
);

export const RANGES = ["7", "30", "season"] as const;
export type PerformanceRange = (typeof RANGES)[number];

export const RANGE_OPTIONS: { value: PerformanceRange; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "season", label: "This season" },
];

// Fans in the range relative to 30 days.
export const RANGE_SCALE: Record<PerformanceRange, number> = { "7": 0.24, "30": 1, season: 3.4 };
