// Find Organizations: the search form's shape. The chips, radius options and sorts come from
// GET /fanhub/sponsor-packages/filters, the brand's stores from GET /fanhub/sponsor-profile/locations; the
// organisations and packages from the API (FANHUB_SPONSOR_LOCATION_ACTIVATIONS_FRONTEND.md for the stores).

import { parseMoney } from "@/utils/helper";
import { ALL, type MultiSelectValue } from "@/components/common/multi-select";
import type { FilterOption, NearStores, SponsorSearchSort } from "@/utils/types/sponsor-packages";

// What the sponsor searches with (chip values are the API codes, e.g. "FOOTBALL").
export interface OrgSearch {
  // Part of the organization name; optional.
  name: string;
  // An organizationType code ("SCHOOL", "TOURNAMENT"…); "" for every type.
  type: string;
  // The brand's stores to search near: ALL, or the picked store ids; [] for anywhere (no distance filter).
  stores: MultiSelectValue;
  // Miles from each store, as the Radius select's value; "" for the API's default.
  radius: string;
  sports: string[];
  // BOYS / GIRLS / COED: any of them (OR), together with every other filter (AND).
  genders: string[];
  inApp: string[];
  // Physical asset category codes ("SPONSOR_TENT"…): organizations offering any of them.
  assetCategories: string[];
  // As typed ("$60,000"); "" for any. Sent as budgetCents.
  budget: string;
  // A seasons code from GET /filters ("FALL"…); "" for any.
  season: string;
}

export const DEFAULT_SEARCH: OrgSearch = {
  name: "",
  type: "",
  stores: [],
  radius: "",
  sports: [],
  genders: [],
  inApp: [],
  assetCategories: [],
  budget: "",
  season: "",
};

// The API's default order, with or without stores: most games left this season first.
export const DEFAULT_SORT: SponsorSearchSort = "UPCOMING_GAMES";

// The API takes up to this many store ids, or ALL.
export const MAX_PICKED_STORES = 50;

// The 47 physical asset categories, as the backend lists them (codes and labels, in its order). The
// Physical asset category filter uses GET /filters' `physicalAssetCategories` once the API sends them; this
// list stands in until then.
export const PHYSICAL_ASSET_CATEGORIES: FilterOption[] = [
  { code: "PHYSICAL_BOOTH", label: "Physical Booth" },
  { code: "EVENT_BANNERS", label: "Event Banners" },
  { code: "SIDELINE_BANNERS", label: "Sideline Banners" },
  { code: "COURT_SIDE_BRANDING", label: "Court-Side Branding" },
  { code: "BACKDROP_STEP_AND_REPEAT_WALL", label: "Backdrop / Step-and-Repeat Wall" },
  { code: "SPONSOR_TENT", label: "Sponsor Tent" },
  { code: "BRANDED_TABLE_COVERS", label: "Branded Table Covers" },
  { code: "POP_UP_DISPLAYS", label: "Pop-Up Displays" },
  { code: "RETRACTABLE_BANNER_STANDS", label: "Retractable Banner Stands" },
  { code: "FENCE_BANNERS", label: "Fence Banners" },
  { code: "FLOOR_DECALS", label: "Floor Decals" },
  { code: "COURT_DECALS", label: "Court Decals" },
  { code: "SCOREBOARD_BRANDING", label: "Scoreboard Branding" },
  { code: "LED_PERIMETER_BOARDS", label: "LED Perimeter Boards" },
  { code: "GYMNASIUM_WALL_SIGNAGE", label: "Gymnasium Wall Signage" },
  { code: "SPONSOR_FLAGS", label: "Sponsor Flags" },
  { code: "BRANDED_A_FRAME_SIGNS", label: "Branded A-Frame Signs" },
  { code: "ENTRANCE_ARCH_BRANDING", label: "Entrance Arch Branding" },
  { code: "CHECK_IN_DESK_BRANDING", label: "Check-In Desk Branding" },
  { code: "SPONSOR_BOOTH_DISPLAYS", label: "Sponsor Booth Displays" },
  { code: "BRANDED_INFLATABLE_STRUCTURES", label: "Branded Inflatable Structures" },
  { code: "PODIUM_BRANDING", label: "Podium Branding" },
  { code: "TROPHY_PRESENTATION_BACKDROP", label: "Trophy Presentation Backdrop" },
  { code: "BRANDED_JERSEYS", label: "Branded Jerseys" },
  { code: "TEAM_WARM_UP_SHIRTS", label: "Team Warm-Up Shirts" },
  { code: "BRANDED_TRAINING_EQUIPMENT", label: "Branded Training Equipment" },
  { code: "WATER_BOTTLE_BRANDING", label: "Water Bottle Branding" },
  { code: "BRANDED_BASKETBALLS", label: "Branded Basketballs" },
  { code: "BENCH_BRANDING", label: "Bench Branding" },
  { code: "LOCKER_ROOM_SIGNAGE", label: "Locker Room Signage" },
  { code: "PARKING_LOT_SIGNAGE", label: "Parking Lot Signage" },
  { code: "DIRECTIONAL_SIGNAGE", label: "Directional Signage" },
  { code: "BRANDED_WRISTBANDS", label: "Branded Wristbands" },
  { code: "LANYARDS_AND_CREDENTIAL_BADGES", label: "Lanyards and Credential Badges" },
  { code: "PHYSICAL_PROMOTIONAL_MERCHANDISE", label: "Physical Promotional Merchandise" },
  { code: "PRINTED_FLYERS_AND_BROCHURES", label: "Printed Flyers and Brochures" },
  { code: "SPONSOR_PRODUCT_DISPLAY_STANDS", label: "Sponsor Product Display Stands" },
  { code: "SAMPLING_AND_GIVEAWAY_STATIONS", label: "Sampling and Giveaway Stations" },
  { code: "PHOTO_BOOTH_SETUP", label: "Photo Booth Setup" },
  { code: "BRANDED_CHARGING_STATIONS", label: "Branded Charging Stations" },
  { code: "VIP_LOUNGE_BRANDING", label: "VIP Lounge Branding" },
  { code: "CONCESSION_STAND_BRANDING", label: "Concession Stand Branding" },
  { code: "TICKET_BOOTH_BRANDING", label: "Ticket Booth Branding" },
  { code: "BRANDED_BLEACHER_COVERS", label: "Branded Bleacher Covers" },
  { code: "SPONSOR_PLAQUES_AND_RECOGNITION_BOARDS", label: "Sponsor Plaques and Recognition Boards" },
  { code: "BRANDED_AWARD_DISPLAYS", label: "Branded Award Displays" },
  { code: "EVENT_VEHICLE_WRAPS", label: "Event Vehicle Wraps" },
];

// The search is near some of the brand's stores (else anywhere).
export const searchesNearStores = (search: OrgSearch) => search.stores === ALL || search.stores.length > 0;

// What a tournament's events list needs from the search, so its picker shows the events its card
// counted: the same stores, radius and genders.
export interface EventFilters {
  brandLocationIds?: string;
  radiusMiles?: number;
  genders?: string;
}

// Stores as ALL or comma-separated ids, with the radius (without a picked radius the API's default applies);
// chips as comma-separated codes.
export const eventFiltersOf = (search: OrgSearch): EventFilters => ({
  ...(searchesNearStores(search) && {
    brandLocationIds: search.stores === ALL ? ALL : search.stores.join(","),
    radiusMiles: search.radius ? Number(search.radius) : undefined,
  }),
  ...(search.genders.length && { genders: search.genders.join(",") }),
});

// "Downtown Austin store 0.3 mi, Round Rock store 17.1 mi +3 more": the selected stores an organisation or
// event is near, the first `max` of them (the API lists up to 10 of `nearLocationCount`).
export const nearText = ({ nearLocations, nearLocationCount }: NearStores, max = 2) => {
  const listed = nearLocations
    .slice(0, max)
    .map((l) => `${l.name || l.city || "Store"} ${l.distanceMiles.toFixed(1)} mi`)
    .join(", ");
  const more = nearLocationCount - Math.min(max, nearLocations.length);
  return more > 0 ? `${listed} +${more} more` : listed;
};

// The typed budget in cents, for budgetCents; undefined without one.
export const budgetCentsOf = (search: OrgSearch) => {
  const amount = parseMoney(search.budget);
  return Number.isFinite(amount) ? Math.round(amount * 100) : undefined;
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
