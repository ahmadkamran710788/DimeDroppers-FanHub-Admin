// SAMPLE DATA — there is no add-ons endpoint yet. Mirrors the Figma design (5.3 Sponsors – Add-Ons);
// replace with API calls once the backend exposes sponsorship add-ons.

import type { Stat } from "@/components/common/stat-card";

export type AddOnStatus = "Active" | "Inactive";

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  status: AddOnStatus;
  // Position in the list sponsors see.
  displayOrder: number;
  // Number of sponsorship packages that include this add-on.
  packages: number;
}

export const ADD_ON_STATUSES: readonly AddOnStatus[] = ["Active", "Inactive"];

// Hover repeats the fill so the status dropdown keeps its colour (the menu trigger has a hover bg).
export const ADD_ON_STATUS_COLOR: Record<AddOnStatus, string> = {
  Active: "bg-success hover:bg-success",
  Inactive: "bg-white/30 hover:bg-white/30",
};

export const SAMPLE_STATS: Stat[] = [
  { label: "Total Package Options", value: "14", tint: "rgba(99,139,254,0.5)", caption: "All Time" },
  { label: "Active Options", value: "12", tint: "rgba(101,193,98,0.5)", change: 85.7, caption: "of Total" },
  { label: "Inactive Options", value: "2", tint: "rgba(184,184,184,0.5)", change: 14.3, caption: "of All Options" },
  { label: "Average Price", value: "$288.50", tint: "rgba(193,127,82,0.45)", caption: "Across all active options" },
];

const NAMES = [
  "Physical Signature",
  "Live Announcements",
  "Social Media Blast",
  "Newsletter Blast",
  "Website Listing",
  "Premium Logo Placement",
  "Photo Opportunity",
  "Video Board AD",
  "Ticket Giveaway",
  "Halftime Recognition",
  "Jersey Patch",
  "Scoreboard Sponsor",
  "Team Banner",
  "Concession Coupon",
];

export const SAMPLE_ADD_ONS: AddOn[] = NAMES.map((name, i) => ({
  id: `sample-add-on-${i + 1}`,
  name,
  description: "Custom Signature displayed at game",
  price: i === 1 ? 199 : 500,
  // The last two are inactive, matching the "2 Inactive Options" stat.
  status: i >= NAMES.length - 2 ? "Inactive" : "Active",
  displayOrder: i + 1,
  packages: 8,
}));
