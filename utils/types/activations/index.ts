// FanHub Activations (fanhub/org/activations) — see docs/endpoints/FANHUB_ACTIVATIONS_FRONTEND.md.

export type ActivationCategory = "FAN_ZONE" | "COMMUNITY" | "PLAY" | "PHYSICAL_ADD_ON";
export type GamePhase = "PRE_GAME" | "LIVE" | "POST_GAME" | "FULL_GAME";
export type ActivationOrganizationType = "SCHOOL" | "TOURNAMENT" | "CLUB_TEAM" | "LEAGUE";
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
  isRecommended: boolean;
  defaultPhase: GamePhase;
  defaultCapabilities: Capability[];
  // The slot's starting value (whole dollars).
  defaultValue: number;
  sortOrder: number;
}

export interface CatalogCategory {
  category: ActivationCategory;
  label: string;
  description: string;
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

// ---- GET / POST / PUT / (the inventory view) ----

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
  // The slot's value (whole dollars); starts at the catalog defaultValue.
  value: number;
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

// ---- POST / PUT body ----
// Array order is display order; the backend renumbers sortOrder. Left out of the body: a catalog
// slot is kept as it is, but a custom slot or a level is deleted, and so is a placement left out of
// a slot that is sent.

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
  // Whole dollars, 0 – 1,000,000. Left out: unchanged (new slot: the catalog default).
  value?: number;
  isAvailableForSponsors?: boolean;
  // Defaults to [] — so a slot sent without them loses its placements.
  placements?: PlacementInput[];
}

export interface ActivationInventoryRequest {
  name?: string;
  levels?: LevelInput[];
  activations?: ActivationInput[];
}

// The error envelope: `data` is an object here, not a list.
export interface ActivationApiError {
  message?: string;
  data?: { errors?: { path: string; message: string }[] } | null;
}
