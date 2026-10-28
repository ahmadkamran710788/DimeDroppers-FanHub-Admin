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

// A sponsor's category, picked at sign-up and changed on Sponsor Profile and Brand Assets.
export const SPONSOR_CATEGORY_OPTIONS = toOptions([
  "Sports & Athletic Apparel",
  "Food, Beverage & Nutrition",
  "Technology & Consumer Electronics",
  "Entertainment & Media",
  "Banking, Finance & Payments",
  "Fitness, Health & Recovery",
  "Automotive & Transportation",
  "Fashion & Lifestyle",
  "Education & Career Development",
  "Local Businesses & Community Partners",
  "Insurance & Professional Services",
  "Sports Collectibles & Merchandise",
  "Youth Sports & Family Brands",
  "Sports Technology & Analytics",
  "Community Development & Nonprofits",
  "Travel, Hotels & Hospitality",
  "Telecommunications & Internet",
  "Home, Retail & Consumer Goods",
  "Gaming & Esports",
  "Government & Public Initiatives",
]);

// A campaign's season and goal, on the Campaign Planner and the Find Organizations filters. Mock data
// until the API takes them.
export const SEASON_OPTIONS = toOptions(["Fall 2026 · Winter 2027", "Fall 2026 only", "Full year"]);
export const GOAL_OPTIONS = toOptions(["Brand awareness", "Store traffic", "Community goodwill"]);

// The sponsor's logo: SVG or PNG only (file picker filter, and the check for dropped files).
export const LOGO_ACCEPT = ".svg,.png";
export const isLogoFile = (file: File) => /\.(svg|png)$/i.test(file.name);

// Sponsorship package tiers, from the most to the least expensive.
export const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;
export type Tier = (typeof TIERS)[number];

// "GOLD" → "Gold".
export const tierLabel = (tier: Tier) => tier.charAt(0) + tier.slice(1).toLowerCase();
