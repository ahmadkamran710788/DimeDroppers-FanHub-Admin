// Find Organizations: the search form's shape. The chips, radius options and sorts come from
// GET /fanhub/sponsor-packages/filters; the organisations and packages from the API.

import type { SponsorSearchSort } from "@/utils/types/sponsor-packages";

// What the sponsor searches with (chip values are the API codes, e.g. "FOOTBALL").
export interface OrgSearch {
  // Part of the organization name; optional.
  name: string;
  // An organizationType code ("SCHOOL", "TOURNAMENT"…); "" for every type.
  type: string;
  // A state (the whole state), city, ZIP or address; optional (without it nothing is filtered by
  // distance).
  location: string;
  // Miles, as the Radius select's value; "" until the sponsor picks one.
  radius: string;
  sports: string[];
  // BOYS / GIRLS / COED: any of them (OR), together with every other filter (AND).
  genders: string[];
  inApp: string[];
  venue: string[];
  // As typed ("$60,000"); "" for any. Budget, season and goal are form-only until the API takes them.
  budget: string;
  // A SEASON_OPTIONS / GOAL_OPTIONS value; "" for any.
  season: string;
  goal: string;
}

export const DEFAULT_SEARCH: OrgSearch = {
  name: "",
  type: "",
  location: "",
  radius: "",
  sports: [],
  genders: [],
  inApp: [],
  venue: [],
  budget: "",
  season: "",
  goal: "",
};

// The API's default order, with or without a location: most games left this season first.
export const DEFAULT_SORT: SponsorSearchSort = "UPCOMING_GAMES";

// What a tournament's events list needs from the search, so its picker shows the events its card
// counted: the same location, radius and genders.
export interface EventFilters {
  location?: string;
  radiusMiles?: number;
  genders?: string;
}

// An area is only sent with a location (without a picked radius the API's default applies); chips as
// comma-separated codes.
export const eventFiltersOf = (search: OrgSearch): EventFilters => {
  const location = search.location.trim();
  return {
    ...(location && { location, radiusMiles: search.radius ? Number(search.radius) : undefined }),
    ...(search.genders.length && { genders: search.genders.join(",") }),
  };
};

// Organisations per page of results.
export const PAGE_SIZE = 20;

// Value-bar colors of the result stat cards.
export const STAT_TINTS = {
  organizations: "#3d6f3e",
  packages: "#3d5194",
  addOns: "#5e4277",
};

// Label color of a slot's category in a package's slot list.
export const CATEGORY_COLORS: Record<string, string> = {
  PRE_GAME: "#9fb4f0",
  LIVE: "#ff9a8a",
  POST_GAME: "#cdb3ec",
  ADD_ON: "#f0c36a",
  PHYSICAL_ASSET: "#a3e3a5",
};

// A category's name, for lists that come without one (an activation's lines).
export const CATEGORY_LABELS: Record<string, string> = {
  PRE_GAME: "Pre Game",
  LIVE: "Live",
  POST_GAME: "Post Game",
  ADD_ON: "Add-ons",
  PHYSICAL_ASSET: "Physical Assets",
};

// The tag beside a cart item or an activation: a package or a physical asset.
export const KIND_LABEL = { PACKAGE: "Package", PHYSICAL_ASSET: "Physical asset" } as const;
export const KIND_COLOR = { PACKAGE: CATEGORY_COLORS.PRE_GAME, PHYSICAL_ASSET: CATEGORY_COLORS.PHYSICAL_ASSET } as const;
