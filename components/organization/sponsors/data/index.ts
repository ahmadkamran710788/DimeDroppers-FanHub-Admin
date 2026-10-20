// SAMPLE DATA — there is no sponsors endpoint yet. Mirrors the Figma design (5.1 Sponsors);
// replace with API calls once the backend exposes sponsors.

import type { DonutSlice } from "@/components/common/donut-breakdown";
import type { RankedItem } from "@/components/common/ranked-list";
import type { Stat } from "@/components/common/stat-card";

export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Bronze";
export type SponsorStatus = "Active" | "Pending" | "Expired" | "Inactive";

export interface Sponsor {
  id: string;
  name: string;
  // Partnership description under the name, e.g. "Official Apparel Partner".
  role: string;
  logo: string;
  featured: boolean;
  category: string;
  tier: SponsorTier;
  status: SponsorStatus;
  value: number;
  interactions: number;
}

export const TIER_COLOR: Record<SponsorTier, string> = {
  Platinum: "bg-[#3030FF]",
  Gold: "bg-[#638BFE]",
  Silver: "bg-[#FF8D2A]",
  Bronze: "bg-success",
};

export const STATUS_COLOR: Record<SponsorStatus, string> = {
  Active: "bg-success",
  Pending: "bg-[#FF8D2A]",
  Expired: "bg-error",
  Inactive: "bg-white/30",
};

export const SAMPLE_STATS: Stat[] = [
  { label: "Total Sponsors", value: "20", tint: "rgba(99,139,254,0.5)", caption: "75% of Total" },
  { label: "Active Sponsors", value: "18", tint: "rgba(101,193,98,0.5)", caption: "75% of Total" },
  { label: "Pending Sponsors", value: "2", tint: "rgba(184,184,184,0.5)", caption: "All Time" },
  { label: "Total Annual Value", value: "$126,450", tint: "rgba(157,98,193,0.5)", change: 18.5, caption: "vs Last 30 Days" },
];

export const SAMPLE_BREAKDOWN_TOTAL = 24;

export const SAMPLE_BREAKDOWN: DonutSlice[] = [
  { label: "Platinum", detail: "3", percent: 12.5, color: "#3030FF" },
  { label: "Gold", detail: "5", percent: 20.8, color: "#638BFE" },
  { label: "Silver", detail: "4", percent: 16.7, color: "#FF8D2A" },
  { label: "Bronze", detail: "8", percent: 33.3, color: "#65C162" },
  { label: "Other", detail: "4", percent: 16.7, color: "rgba(255,255,255,0.1)" },
];

export const SAMPLE_TOP_SPONSORS: RankedItem[] = [
  { name: "Nike", amount: 25000 },
  { name: "Gatorade", amount: 15000 },
  { name: "Adidas", amount: 12000 },
  { name: "Chick-fil-A", amount: 7500 },
  { name: "State Farm", amount: 6000 },
];

// A few non-active rows so the status tabs have something to show.
const STATUS_AT: Partial<Record<number, SponsorStatus>> = { 13: "Pending", 14: "Pending", 15: "Expired", 16: "Inactive", 17: "Inactive" };

export const SAMPLE_SPONSORS: Sponsor[] = Array.from({ length: 18 }, (_, i) => ({
  id: `sample-sponsor-${i + 1}`,
  name: "Nike",
  role: "Official Apparel Partner",
  logo: "/images/sponsor-sample.png",
  featured: i === 0,
  category: "Apparel",
  tier: "Platinum",
  status: STATUS_AT[i] ?? "Active",
  value: 25000,
  interactions: 24,
}));
