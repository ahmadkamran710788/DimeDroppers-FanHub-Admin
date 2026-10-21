import type { Tier } from "@/components/sponsor/data";

// Mock data for Find Organizations until the organization search API is integrated. The
// organizations, their packages and add-ons go away with it; the filter lists may stay.

export const SPORTS = ["Football", "Basketball", "Volleyball", "Soccer", "Baseball", "Softball", "Hockey", "Track & Field"] as const;
export type Sport = (typeof SPORTS)[number];

// Where the brand shows inside the organization's Fan Hub.
export const IN_APP_INVENTORY = ["Predictions", "Voting", "Schedule", "Watch Live", "Challenges", "Quests"] as const;
export type InAppInventory = (typeof IN_APP_INVENTORY)[number];

// Physical space at fields, courts and gyms.
export const VENUE_INVENTORY = ["Banners", "Scoreboard", "Jersey patch", "Court & field signage"] as const;
export type VenueInventory = (typeof VENUE_INVENTORY)[number];

export const SPORT_OPTIONS = SPORTS.map((s) => ({ label: s, value: s }));
export const IN_APP_OPTIONS = IN_APP_INVENTORY.map((i) => ({ label: i, value: i }));
export const VENUE_OPTIONS = VENUE_INVENTORY.map((v) => ({ label: v, value: v }));

// Miles from the location.
export const RADIUS_OPTIONS = [10, 25, 50, 100].map((miles) => ({ label: `${miles} miles`, value: String(miles) }));

export const SORTS = ["Nearest", "Largest fan reach", "Lowest price"] as const;
export type SortOption = (typeof SORTS)[number];

// What the sponsor searches with.
export interface OrgSearch {
  location: string;
  // Miles, as the Radius select's value.
  radius: string;
  sports: Sport[];
  inApp: InAppInventory[];
  venue: VenueInventory[];
}

export const DEFAULT_SEARCH: OrgSearch = {
  location: "Twin Lakes, WI",
  radius: "25",
  sports: ["Football", "Basketball"],
  inApp: ["Predictions", "Watch Live", "Quests"],
  venue: ["Banners"],
};

// Venue space or an on-site extra an organization sells on top of a package.
export interface PhysicalAddOn {
  name: string;
  // Dimensions, or the format when it isn't a sign ("PA", "30 sec").
  size: string;
  where: string;
  available: number;
  price: number;
}

export interface Organization {
  id: number;
  name: string;
  initials: string;
  // Fill of the initials tile.
  color: string;
  // Miles from the searched location.
  distance: number;
  sports: Sport[];
  // Fans following the organization.
  reach: number;
  inApp: InAppInventory[];
  venue: VenueInventory[];
  // Season price and packages left per tier, in TIERS order.
  prices: number[];
  packagesLeft: number[];
  games: number;
  season: string;
  addOns: PhysicalAddOn[];
}

const ALL_IN_APP = [...IN_APP_INVENTORY];

const ORGS: Omit<Organization, "id">[] = [
  {
    name: "Twin Lakes Academy", initials: "TLA", color: "#3d6f3e", distance: 2.4,
    sports: ["Football", "Basketball", "Volleyball"], reach: 4800, inApp: ALL_IN_APP, venue: ["Banners", "Scoreboard"],
    prices: [2400, 1500, 800, 350], packagesLeft: [1, 2, 3, 5], games: 24, season: "Fall 2026 · Winter 2027",
    addOns: [
      { name: "Football field fence banner", size: "8×3 ft", where: "Home sideline", available: 2, price: 300 },
      { name: "Gym wall banner", size: "10×4 ft", where: "Main gym, baseline", available: 1, price: 450 },
      { name: "Scoreboard panel", size: "6×2 ft", where: "Football scoreboard", available: 1, price: 600 },
      { name: "PA announcement", size: "PA", where: "Every home game", available: 1, price: 150 },
    ],
  },
  {
    name: "Lakeview Youth Soccer Club", initials: "LYS", color: "#3d5194", distance: 6.1,
    sports: ["Soccer"], reach: 2100, inApp: ["Voting", "Schedule", "Challenges", "Quests"], venue: ["Banners", "Court & field signage"],
    prices: [1600, 900, 450, 150], packagesLeft: [1, 1, 3, 4], games: 16, season: "Fall 2026",
    addOns: [
      { name: "Pitch-side banner", size: "6×3 ft", where: "Field 1", available: 3, price: 180 },
      { name: "Goal-end banner", size: "8×3 ft", where: "Field 2", available: 1, price: 220 },
      { name: "Booth at tournament day", size: "10×10", where: "Spring tournament", available: 2, price: 120 },
    ],
  },
  {
    name: "Silver Ridge High School", initials: "SRH", color: "#5e4277", distance: 9.8,
    sports: ["Baseball", "Softball", "Track & Field"], reach: 3600, inApp: ["Predictions", "Voting", "Schedule", "Watch Live", "Quests"], venue: ["Banners"],
    prices: [2000, 1200, 650, 250], packagesLeft: [1, 1, 2, 3], games: 20, season: "Spring 2027",
    addOns: [
      { name: "Outfield fence banner", size: "8×4 ft", where: "Baseball field", available: 1, price: 350 },
      { name: "Dugout roof banner", size: "12×2 ft", where: "Softball field", available: 1, price: 280 },
    ],
  },
  {
    name: "Northfield Community College", initials: "NCC", color: "#7a4a2e", distance: 14.2,
    sports: ["Basketball", "Hockey"], reach: 7900, inApp: ["Predictions", "Schedule", "Watch Live", "Challenges", "Quests"], venue: ["Banners", "Scoreboard", "Court & field signage"],
    prices: [3500, 2000, 1100, 600], packagesLeft: [2, 2, 2, 4], games: 30, season: "Winter 2026–27",
    addOns: [
      { name: "Rink dasher board", size: "8×3 ft", where: "Ice arena", available: 2, price: 700 },
      { name: "Courtside LED slot", size: "30 sec", where: "Arena court", available: 1, price: 500 },
    ],
  },
  {
    name: "Maple Grove Middle School", initials: "MGM", color: "#2f6b6b", distance: 4.7,
    sports: ["Football", "Basketball"], reach: 1900, inApp: ["Predictions", "Voting", "Schedule", "Quests"], venue: ["Banners"],
    prices: [1200, 750, 400, 150], packagesLeft: [1, 2, 2, 3], games: 18, season: "Fall 2026 · Winter 2027",
    addOns: [
      { name: "Gym wall banner", size: "8×3 ft", where: "School gym", available: 2, price: 200 },
      { name: "Practice field banner", size: "6×3 ft", where: "Practice field fence", available: 2, price: 150 },
      { name: "PA announcement", size: "PA", where: "Every home game", available: 1, price: 80 },
    ],
  },
  {
    name: "Lakeshore Hoops Club", initials: "LHC", color: "#2e4a7a", distance: 21.3,
    sports: ["Basketball"], reach: 2600, inApp: ["Predictions", "Schedule", "Watch Live", "Challenges"], venue: ["Banners", "Jersey patch"],
    prices: [1400, 850, 450, 200], packagesLeft: [1, 1, 2, 4], games: 22, season: "Winter 2026–27",
    addOns: [
      { name: "Courtside banner", size: "10×3 ft", where: "Lakeshore fieldhouse", available: 2, price: 250 },
      { name: "Jersey patch", size: "3×3 in", where: "Travel team jerseys", available: 1, price: 400 },
    ],
  },
  {
    name: "Fox Hollow Prep", initials: "FHP", color: "#6b3d5e", distance: 33.5,
    sports: ["Football", "Soccer", "Volleyball"], reach: 5200, inApp: ALL_IN_APP, venue: ["Banners", "Scoreboard", "Court & field signage"],
    prices: [2800, 1700, 900, 400], packagesLeft: [1, 1, 2, 3], games: 26, season: "Fall 2026",
    addOns: [
      { name: "Stadium fence banner", size: "8×3 ft", where: "Home stands", available: 2, price: 350 },
      { name: "Scoreboard panel", size: "6×2 ft", where: "Stadium scoreboard", available: 1, price: 650 },
      { name: "End zone signage", size: "12×2 ft", where: "North end zone", available: 2, price: 300 },
    ],
  },
  {
    name: "Pine Bluff Hockey Association", initials: "PBH", color: "#4a5a2e", distance: 47.8,
    sports: ["Hockey"], reach: 1500, inApp: ["Schedule", "Watch Live", "Quests"], venue: ["Banners", "Court & field signage"],
    prices: [1500, 900, 500, 200], packagesLeft: [1, 2, 2, 3], games: 28, season: "Winter 2026–27",
    addOns: [
      { name: "Rink dasher board", size: "8×3 ft", where: "Home rink", available: 3, price: 400 },
      { name: "Penalty box banner", size: "6×2 ft", where: "Home rink", available: 1, price: 250 },
    ],
  },
];

export const ORGANIZATIONS: Organization[] = ORGS.map((org, id) => ({ id, ...org }));

// One in-app placement a package includes.
export interface PackageSlot {
  place: InAppInventory;
  slot: string;
}

// What each tier includes; a package lists only the placements its organization offers.
export const PACKAGE_SLOTS: Record<Tier, PackageSlot[]> = {
  PLATINUM: [
    { place: "Watch Live", slot: "Pre-roll video, 15 sec" },
    { place: "Watch Live", slot: "Halftime logo overlay" },
    { place: "Predictions", slot: "Title sponsor, “presented by”" },
    { place: "Predictions", slot: "Winner prize branding" },
    { place: "Voting", slot: "Player-of-the-game poll" },
    { place: "Schedule", slot: "Season schedule header" },
    { place: "Schedule", slot: "Logo on home game cards" },
    { place: "Challenges", slot: "Branded challenge" },
    { place: "Quests", slot: "Sponsored quest" },
    { place: "Quests", slot: "Quest reward branding" },
  ],
  GOLD: [
    { place: "Watch Live", slot: "Pre-roll video, 15 sec" },
    { place: "Predictions", slot: "Sponsor logo" },
    { place: "Schedule", slot: "Logo on home game cards" },
    { place: "Quests", slot: "Sponsored quest" },
    { place: "Quests", slot: "Quest reward branding" },
  ],
  SILVER: [
    { place: "Watch Live", slot: "Pre-roll video, 15 sec" },
    { place: "Voting", slot: "Player-of-the-game poll" },
    { place: "Challenges", slot: "Branded challenge" },
  ],
  BRONZE: [
    { place: "Schedule", slot: "Logo on home game cards" },
    { place: "Quests", slot: "Sponsored quest" },
  ],
};

// Label color of each placement in a package's slot list.
export const PLACE_COLORS: Record<InAppInventory, string> = {
  "Watch Live": "#ff9a8a",
  Predictions: "#9fb4f0",
  Voting: "#cdb3ec",
  Schedule: "#a3e3a5",
  Challenges: "#f0c36a",
  Quests: "#f0b98f",
};

// Value-bar colors of the result stat cards.
export const STAT_TINTS = {
  organizations: "#3d6f3e",
  packages: "#3d5194",
  addOns: "#5e4277",
};

// Picking an organization starts its panel on the Gold package.
export const DEFAULT_TIER: Tier = "GOLD";
