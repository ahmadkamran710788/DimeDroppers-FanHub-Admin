// Find Organizations: the search form's shape. The chips, radius options and sorts come from
// GET /fanhub/sponsor-packages/filters; the organisations and packages from the API.

// What the sponsor searches with (chip values are the API codes, e.g. "FOOTBALL").
export interface OrgSearch {
  // Part of the organization name; optional.
  name: string;
  // An organizationType code ("SCHOOL", "TOURNAMENT"…); "" for every type.
  type: string;
  // City and state, ZIP or address; optional (without it nothing is filtered by distance).
  location: string;
  // Miles, as the Radius select's value.
  radius: string;
  sports: string[];
  inApp: string[];
  venue: string[];
}

export const DEFAULT_SEARCH: OrgSearch = { name: "", type: "", location: "", radius: "25", sports: [], inApp: [], venue: [] };

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
  EXCLUSIVITY: "#a3e3a5",
};
