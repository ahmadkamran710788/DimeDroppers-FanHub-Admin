import type { Crest } from "@/components/sponsor/org-crest";
import type { SponsorStat } from "@/components/sponsor/stat-tile";

// Mock data for the Fundable Needs page until the sponsor API is integrated.

export const CATEGORIES = ["All", "Equipment", "Travel", "Tech", "Scholarships", "Facilities"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface FundableNeed extends Crest {
  id: number;
  org: string;
  title: string;
  // Upper-case label of one of CATEGORIES (not "All").
  category: string;
  raised: number;
  goal: number;
  daysLeft: number;
  // What the sponsor's brand gets.
  recognition: string;
}

const CRESTS: Record<string, Crest> = {
  "Twin Lakes Academy": { color: "#3d6f3e", trim: "#a3e3a5" },
  "Lakeview Youth Soccer Club": { color: "#3d5194", trim: "#9fb4f0" },
  "Silver Ridge High School": { color: "#5e4277", trim: "#cdb3ec" },
  "Northfield Community College": { color: "#7a4a2e", trim: "#f0b98f" },
};

export const NEEDS: FundableNeed[] = [
  { org: "Twin Lakes Academy", title: "New volleyball nets & poles", category: "EQUIPMENT", raised: 1150, goal: 3200, daysLeft: 18, recognition: "Logo on net padding · 3 social posts" },
  { org: "Lakeview Youth Soccer Club", title: "Travel to the State Cup", category: "TRAVEL", raised: 2400, goal: 6000, daysLeft: 9, recognition: "Logo on travel shirts · livestream thank-you" },
  { org: "Silver Ridge High School", title: "Livestream camera kit", category: "TECH", raised: 600, goal: 2500, daysLeft: 30, recognition: "“Presented by” tag on every home stream" },
  { org: "Northfield Community College", title: "Hockey team helmets", category: "EQUIPMENT", raised: 4100, goal: 5000, daysLeft: 6, recognition: "Helmet decal · scoreboard thank-you" },
  { org: "Twin Lakes Academy", title: "Summer camp scholarships", category: "SCHOLARSHIPS", raised: 900, goal: 4000, daysLeft: 45, recognition: "Named scholarship · awards night mention" },
  { org: "Silver Ridge High School", title: "Dugout renovation", category: "FACILITIES", raised: 3300, goal: 12000, daysLeft: 60, recognition: "Dugout signage for two seasons" },
].map((need, id) => ({ id, ...CRESTS[need.org], ...need }));

export const STATS: SponsorStat[] = [
  { label: "OPEN NEEDS NEARBY", value: "6", tint: "#3d6f3e", caption: "2 closing in the next 10 days" },
  { label: "STILL NEEDED", value: "$20,250", tint: "#3d5194", caption: "across 4 organizations" },
  { label: "FUNDED BY YOU", value: "$1,200", tint: "#5e4277", caption: "2 needs this season" },
];

// Preset amounts; the panel adds a fourth, "Fund rest", for what the need still lacks.
export const PRESET_AMOUNTS = [250, 500, 1000];

const toOptions = (labels: string[]) => labels.map((label) => ({ label, value: label }));

export const AREA_OPTIONS = toOptions(["Within 25 mi", "Within 50 mi", "Statewide"]);
export const SORT_OPTIONS = toOptions(["Closing soonest", "Closest to goal", "Smallest ask"]);
export const BRAND_ASSET_OPTIONS = toOptions(["Primary logo · full color", "Wordmark · white", "Logo mark only"]);
