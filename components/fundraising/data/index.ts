// SAMPLE DATA — there is no fundraising endpoint yet. Everything in this file mirrors the
// Figma design (8.1 Fundraising) and must be replaced with API calls once the backend exists.

export type CampaignType = "Project" | "Team" | "Fundraiser";
export type CampaignStatus = "Active" | "Draft" | "Ended";

export interface FundraisingCampaign {
  id: string;
  // Team the campaign raises money for (sample team ids until the API exists).
  teamId: string;
  title: string;
  description: string;
  image: string;
  type: CampaignType;
  goal: number;
  raised: number;
  status: CampaignStatus;
  endDate: string;
  daysLeft: number;
}

export interface FundraisingStat {
  label: string;
  value: string;
  // Background of the value bar.
  tint: string;
  // Change vs the previous period in percent; omitted when the caption is static.
  change?: number;
  caption: string;
}

export interface GivingSlice {
  type: CampaignType;
  amount: number;
  percent: number;
  color: string;
}

export interface TopDonor {
  name: string;
  amount: number;
}

export const SAMPLE_STATS: FundraisingStat[] = [
  { label: "Total Raised", value: "$48,750.20", tint: "rgba(101,193,98,0.5)", change: 18.5, caption: "vs Last 30 Days" },
  { label: "Total Donations", value: "367", tint: "rgba(99,139,254,0.5)", change: -5, caption: "vs Last 30 Days" },
  { label: "Active Campaigns", value: "6", tint: "rgba(157,98,193,0.5)", caption: "No Changes vs Last 30 Days" },
  { label: "Pending Sponsors", value: "2", tint: "rgba(184,184,184,0.5)", caption: "All Time" },
];

export const SAMPLE_GIVING_TOTAL = 48735;

export const SAMPLE_GIVING: GivingSlice[] = [
  { type: "Project", amount: 30575, percent: 62.7, color: "#3030FF" },
  { type: "Team", amount: 8710, percent: 17.9, color: "#FF8D2A" },
  { type: "Fundraiser", amount: 9450, percent: 19.4, color: "#65C162" },
];

export const SAMPLE_TOP_DONORS: TopDonor[] = [
  { name: "Alfredo Schleifer", amount: 5000 },
  { name: "Haylie George", amount: 3500 },
  { name: "Gustavo Dorwart", amount: 1000 },
  { name: "Marcus Gouse", amount: 500 },
  { name: "Jakob Dorwart", amount: 325 },
];

const CAMPAIGN_TITLES = [
  "New Football Helmets",
  "Tournament Entry Fees",
  "Away Game Travel Fund",
  "Team Meals for the Season",
  "New Practice Uniforms",
  "Gym Equipment Upgrade",
];

// Sample team for each campaign, so teams have 0–3 campaigns (ids match components/teams/data).
const CAMPAIGN_TEAM = [1, 1, 1, 2, 2, 3, 4, 4, 4, 5, 7, 7, 8, 10, 10, 12, 13, 15];

export const SAMPLE_CAMPAIGNS: FundraisingCampaign[] = Array.from({ length: 18 }, (_, i) => ({
  id: `sample-campaign-${i + 1}`,
  teamId: `team-${CAMPAIGN_TEAM[i]}`,
  title: CAMPAIGN_TITLES[i % CAMPAIGN_TITLES.length],
  description:
    "Help us upgrade our football helmets for safety and performance. The team will be glad to get your support on that.",
  image: "/images/fundraising-campaign-sample.jpg",
  type: "Project",
  goal: 25000,
  raised: 9425.53,
  status: "Active",
  endDate: "2026-06-30",
  daysLeft: 5,
}));

export const CAMPAIGN_TYPE_COLOR: Record<CampaignType, string> = {
  Project: "bg-[#3030FF]",
  Team: "bg-[#FF8D2A]",
  Fundraiser: "bg-success",
};

export const CAMPAIGN_STATUS_COLOR: Record<CampaignStatus, string> = {
  Active: "bg-success",
  Draft: "bg-white/30",
  Ended: "bg-white/30",
};
