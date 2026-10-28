import { toOptions } from "@/utils/helper";

// The signed-in sponsor, shown in the sponsor header and sidebar. Mock data until sponsor
// auth is integrated.
export const SPONSOR_PROFILE = {
  name: "Northpeak Energy",
  email: "partners@northpeak.co",
  initials: "NP",
  // National accounts get Dime AI's Campaign Planner.
  nationalAccount: true,
};

// A sponsor's category, picked at sign-up and changed on Sponsor Profile.
export const SPONSOR_CATEGORY_OPTIONS = toOptions([
  "Energy & utilities",
  "Food & restaurants",
  "Automotive",
  "Banking & insurance",
  "Healthcare",
  "Retail",
  "Real estate",
  "Sports & fitness",
  "Local services",
]);

// The sponsor's logo: SVG or PNG only (file picker filter, and the check for dropped files).
export const LOGO_ACCEPT = ".svg,.png";
export const isLogoFile = (file: File) => /\.(svg|png)$/i.test(file.name);

// Sponsorship package tiers, from the most to the least expensive.
export const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;
export type Tier = (typeof TIERS)[number];

// "GOLD" → "Gold".
export const tierLabel = (tier: Tier) => tier.charAt(0) + tier.slice(1).toLowerCase();
