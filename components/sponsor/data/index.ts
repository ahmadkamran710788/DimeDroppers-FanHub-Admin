// The signed-in sponsor, shown in the sponsor header and sidebar. Mock data until sponsor
// auth is integrated.
export const SPONSOR_PROFILE = {
  name: "Northpeak Energy",
  email: "partners@northpeak.co",
  initials: "NP",
  // National accounts get Dime AI's Campaign Planner.
  nationalAccount: true,
};

// Sponsorship package tiers, from the most to the least expensive.
export const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;
export type Tier = (typeof TIERS)[number];

// "GOLD" → "Gold".
export const tierLabel = (tier: Tier) => tier.charAt(0) + tier.slice(1).toLowerCase();
