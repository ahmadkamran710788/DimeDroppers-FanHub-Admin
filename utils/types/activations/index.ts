// FanHub Activations (fanhub/org/activations) — see docs/endpoints/FANHUB_ACTIVATIONS_FRONTEND.md.

export type ActivationCategory = "PRE_GAME" | "LIVE" | "POST_GAME" | "ADD_ON" | "EXCLUSIVITY";
export type GamePhase = "PRE_GAME" | "LIVE" | "POST_GAME" | "FULL_GAME";
export type ActivationOrganizationType = "SCHOOL" | "TOURNAMENT" | "CLUB_TEAM" | "LEAGUE";
// CATEGORY_BASE: the value is Dime's base value for the category. ORGANIZATION: the org set it
// (Exclusivity only). Exclusivity has no catalog slots: every one is added by the organisation.
export type ValueSource = "CATEGORY_BASE" | "ORGANIZATION";
export type Capability =
  | "IMPRESSION"
  | "CLICK_THROUGH"
  | "QR_SCAN"
  | "OFFER_CLAIM"
  | "COUPON_REDEMPTION"
  | "PREDICTION"
  | "VOTE"
  | "POLL_SURVEY"
  | "CHALLENGE_QUEST"
  | "TRIVIA_ARCADE"
  | "CHECK_IN"
  | "CONTENT_VIEW"
  | "VIDEO_VIEW"
  | "PURCHASE"
  | "DONATION"
  | "PHOTO_BOOTH"
  | "PRODUCT_SAMPLING";

export interface CapabilityOption {
  capability: Capability;
  label: string;
}

export interface PhaseOption {
  phase: GamePhase;
  label: string;
}

// ---- GET /catalog ----

export interface CatalogItem {
  key: string;
  name: string;
  description: string;
  // e.g. "12 x 12 ft" on banners.
  size: string | null;
  isRecommended: boolean;
  defaultPhase: GamePhase;
  defaultCapabilities: Capability[];
  sortOrder: number;
}

export interface CatalogCategory {
  category: ActivationCategory;
  label: string;
  description: string;
  // Dime's value for every slot in the category (whole dollars).
  baseValue: number;
  // Only Exclusivity: the org can set its slots' value and size.
  isEditable: boolean;
  itemCount: number;
  recommendedCount: number;
  items: CatalogItem[];
}

export interface ActivationCatalog {
  organizationType: ActivationOrganizationType;
  organizationTypeLabel: string;
  categories: CatalogCategory[];
  phases: PhaseOption[];
  capabilities: CapabilityOption[];
}

// ---- GET / PUT (the inventory view) ----

export interface ActivationLevel {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ActivationPlacement {
  id: string;
  levelId: string;
  levelName: string;
  phase: GamePhase;
  phaseLabel: string;
  value: number;
  slotCount: number;
  totalValue: number;
  sortOrder: number;
  capabilities: CapabilityOption[];
}

// GET / lists every slot for the org's type, saved or not.
export interface InventoryActivation {
  // null for a catalog slot not saved yet (added to the catalog after the last save).
  id: string | null;
  isSaved: boolean;
  // null for a custom activation.
  catalogKey: string | null;
  isCustom: boolean;
  isRecommended: boolean;
  name: string;
  description: string | null;
  // The effective size: the org's own, else the catalog's.
  size: string | null;
  // The effective value (whole dollars): the org's own, else the category base value.
  value: number;
  valueSource: ValueSource;
  // Only Exclusivity slots: value and size can be changed.
  isEditable: boolean;
  // The checkbox: sponsors can see this slot.
  isAvailableForSponsors: boolean;
  sortOrder: number;
  // Sum of the placements' totalValue (not the slot value).
  totalValue: number;
  placements: ActivationPlacement[];
}

export interface InventoryCategory {
  category: ActivationCategory;
  label: string;
  description: string;
  baseValue: number;
  isEditable: boolean;
  // Slots in the column (the Select All (n) number).
  activationCount: number;
  // Ticked slots, and the sum of their value.
  selectedCount: number;
  selectedValue: number;
  activations: InventoryActivation[];
}

export interface ValueBreakdown<K extends string = string> {
  key: K;
  label: string;
  placementCount: number;
  slotCount: number;
  totalValue: number;
}

// ---- Tournament: the events the inventory covers and the tournament format ----

export type TournamentFormat = "ROUND_ROBIN" | "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "POOL_PLAY_BRACKET";

export interface ActivationTournamentEvent {
  id: string;
  exposureEventId: number;
  name: string | null;
  sport: string | null;
  city: string | null;
  state: string | null;
  startDate: string | null;
  endDate: string | null;
}

// One inventory per event: the event it belongs to and that event's format.
export interface ActivationTournament {
  event: ActivationTournamentEvent | null;
  format: TournamentFormat | null;
  formatLabel: string | null;
  formatOptions: { value: TournamentFormat; label: string }[];
  // ["FORMAT"] until the event has a format.
  missing: "FORMAT"[];
}

// GET /activations/events: the organisation's events with each one's inventory status.
export interface ActivationEventOption extends ActivationTournamentEvent {
  // null: never opened.
  inventory: {
    id: string;
    version: number;
    format: TournamentFormat | null;
    formatLabel: string | null;
    // Has a format, so it can be saved and sold.
    isSetUp: boolean;
    lastSavedAt: string;
  } | null;
}

export interface ActivationEventsPage {
  items: ActivationEventOption[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ActivationInventory {
  id: string;
  schoolId: string;
  organizationType: ActivationOrganizationType;
  organizationTypeLabel: string;
  name: string;
  version: number;
  isOnSale: true;
  onSaleAt: string;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
  levels: ActivationLevel[];
  // false for a tournament until it has saved events and a format.
  canSave: boolean;
  // null for every other organisation type.
  tournament: ActivationTournament | null;
  categories: InventoryCategory[];
  summary: {
    activationCount: number;
    availableForSponsorsCount: number;
    // Sum of value across all slots / across the ticked ones.
    slotValue: number;
    availableForSponsorsValue: number;
    placementCount: number;
    slotCount: number;
    totalValue: number;
    byLevel: ValueBreakdown[];
    byPhase: ValueBreakdown<GamePhase>[];
    byCategory: ValueBreakdown<ActivationCategory>[];
  };
}

// ---- PUT body ----
// Array order is display order: sent slots are numbered first, in the order sent, and slots left
// out follow. Left out of the body: a catalog slot is kept as it is, but a custom slot or a level
// is deleted, and so is a placement left out of a slot that is sent.

export interface LevelInput {
  id?: string;
  name: string;
}

export interface PlacementInput {
  id?: string;
  // Must match a name in `levels` of the same body (ignoring case).
  levelName: string;
  phase: GamePhase;
  // Whole dollars, 1 – 1,000,000.
  value: number;
  slotCount?: number;
  // Omit to use the catalog item's defaults.
  capabilities?: Capability[];
}

export interface ActivationInput {
  id?: string;
  // A catalog activation…
  catalogKey?: string;
  // …or a custom one (category + name).
  category?: ActivationCategory;
  name?: string;
  description?: string | null;
  // Exclusivity only. Whole dollars, 0 – 1,000,000; null = back to the default. Left out: unchanged.
  value?: number | null;
  // Exclusivity only. 1 – 40 chars; null = back to the catalog size. Left out: unchanged.
  size?: string | null;
  isAvailableForSponsors?: boolean;
  // Defaults to [] — so a slot sent without them loses its placements.
  placements?: PlacementInput[];
}

export interface ActivationInventoryRequest {
  name?: string;
  levels?: LevelInput[];
  activations?: ActivationInput[];
  // Tournament only (400 for anyone else): the event's format, needed on its first save; left out,
  // the saved one is kept.
  tournamentFormat?: TournamentFormat | null;
}

// The error envelope: `data` is an object here, not a list.
export interface ActivationApiError {
  message?: string;
  data?: { errors?: { path: string; message: string }[] } | null;
}
