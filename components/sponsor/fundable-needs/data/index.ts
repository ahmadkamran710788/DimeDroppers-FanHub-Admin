import type { FilterChipOption } from "@/components/common/filter-chips";
import type { BrandDisplay, NeedSponsorSort, NeedStatus } from "@/utils/types/needs";

// Fundable Needs (sponsor side): the filter, sort and form options. The needs themselves come from
// GET /fanhub/sponsor-needs (docs/endpoints/FANHUB_FUNDABLE_NEEDS_FRONTEND.md §5).

// "All" sends no categoryCode.
export const ALL_CATEGORIES = "ALL";

// The need types. Only Travel and Transportation is switched on in the backend so far; the others show as
// "Coming soon" and are never sent. Their codes are placeholders until the backend confirms them: switching
// one on means fixing its code and dropping `disabled`.
export const CATEGORY_CHIPS: FilterChipOption<string>[] = [
  { value: ALL_CATEGORIES, label: "All" },
  ...[
    { value: "EQUIPMENT_AND_UNIFORMS", label: "Equipment & uniforms" },
    { value: "TRAVEL_AND_TRANSPORTATION", label: "Travel & transport", enabled: true },
    { value: "MEDIA_AND_STREAMING", label: "Media & streaming" },
    { value: "FACILITIES_AND_OPERATIONS", label: "Facilities & operations" },
    { value: "DEVELOPMENT_AND_EDUCATION", label: "Development & education" },
    { value: "HEALTH_AND_WELLNESS", label: "Health & wellness" },
  ].map(({ enabled, ...chip }) =>
    enabled ? chip : { ...chip, disabled: true, badge: "Soon", title: "Coming soon" }
  ),
];

// Which of the sponsor's stores the needs are near (brandLocationIds): all of them, or one store's id.
export const ALL_STORES = "ALL";

// The area around those stores: "" = anywhere (no brandLocationIds), otherwise the radius in miles.
export const ANYWHERE = "";
export const DEFAULT_RADIUS = "25";
export const AREA_OPTIONS = [
  { value: ANYWHERE, label: "Anywhere" },
  ...["10", "25", "50", "100"].map((miles) => ({ value: miles, label: `Within ${miles} mi` })),
];

// NEAREST needs an area (it sorts by distance to the sponsor's stores).
export const SORT_OPTIONS: { value: NeedSponsorSort; label: string; needsArea?: boolean }[] = [
  { value: "CLOSING_SOONEST", label: "Closing soonest" },
  { value: "NEWEST", label: "Newest" },
  { value: "NEAREST", label: "Nearest", needsArea: true },
];

// "Show my brand as".
export const BRAND_DISPLAY_OPTIONS: { value: BrandDisplay; label: string }[] = [
  { value: "LOGO_FULL_COLOR", label: "Logo · full color" },
  { value: "LOGO_ONE_COLOR", label: "Logo · one color" },
  { value: "NAME_ONLY", label: "Name only" },
];

// Preset amounts; the panel adds a fourth, "Fund rest", for what the need still lacks.
export const PRESET_AMOUNTS_CENTS = [25000, 50000, 100000];
export const MIN_CONTRIBUTION_CENTS = 1000;
export const NOTE_MAX = 1000;

// A need closing within this many days shows its deadline in orange (the summary's "closing soon" window).
export const URGENT_DAYS = 10;

export const NEEDS_PAGE_SIZE = 12;
export const FUNDED_PAGE_SIZE = 10;
export const TRANSACTIONS_PAGE_SIZE = 20;

// A need's status as the sponsor reads it.
export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  OPEN: "Open",
  FUNDED: "Fully funded",
  ENDED: "Ended, settling",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

// Shared with the organisation screens; re-exported so the sponsor components import from one place.
export { dollars, daysLeftLabel, placeLabel, humanizeSlug } from "@/utils/needs";
