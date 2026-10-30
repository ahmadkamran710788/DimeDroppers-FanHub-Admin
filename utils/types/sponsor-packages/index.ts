// Sponsor packages: /fanhub/sponsor-packages/* (sponsor token). All money is in cents.

export type PackageTier = "COMMUNITY_PARTNER" | "FAN_ENGAGEMENT_PARTNER" | "PRESENTING_PARTNER";
export type SponsorOrganizationType = "SCHOOL" | "TOURNAMENT" | "CLUB_TEAM" | "LEAGUE";
export type PriceBasis = "TEAMS" | "GAMES";
export type PackageActivationStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";
export type UnavailableReason =
  | "NO_SLOTS"
  | "NO_TEAMS"
  | "NO_GAMES"
  | "NO_UPCOMING_GAMES"
  | "EVENT_ENDED"
  | "TOURNAMENT_INCOMPLETE";
export type SponsorSearchSort =
  | "UPCOMING_GAMES"
  | "ATTENDANCE"
  | "PRICE_LOW"
  | "PRICE_HIGH"
  | "NEAREST"
  | "NAME"
  | "FAN_REACH";

export interface FilterOption {
  code: string;
  label: string;
}

// GET /filters
export interface SponsorSearchFilters {
  radiusOptions: number[];
  radiusDefaultMiles: number;
  sports: FilterOption[];
  inApp: FilterOption[];
  // BOYS / GIRLS / COED.
  genders: FilterOption[];
  organizationTypes: FilterOption[];
  sorts: FilterOption[];
  // FALL_WINTER / FALL / FULL_YEAR, labelled with their years; seasons already over are left out.
  seasons: FilterOption[];
  // The 47 physical asset categories, the same as the organisation's Activations page.
  physicalAssetCategories: FilterOption[];
}

export interface SponsorOrganization {
  id: string;
  name: string | null;
  organizationType: SponsorOrganizationType;
  organizationTypeLabel: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
}

// The brand's stores in a search near them (FANHUB_SPONSOR_LOCATION_ACTIVATIONS_FRONTEND.md).

// A selected store within the radius of an organisation or event, nearest first.
export interface SponsorNearLocation {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  distanceMiles: number;
}

// A store the search used, with its point.
export interface SponsorSelectedLocation extends Omit<SponsorNearLocation, "distanceMiles"> {
  latitude: number;
  longitude: number;
}

// A store on an activation, as it was then: id null once the sponsor has deleted the store.
export interface SponsorActivationLocation extends Omit<SponsorNearLocation, "id"> {
  id: string | null;
  latitude: number;
  longitude: number;
  radiusMiles: number;
}

// The selected stores near an organisation or event: at most 10 listed, `nearLocationCount` in all.
export interface NearStores {
  // Empty when the search was not by stores.
  nearLocations: SponsorNearLocation[];
  nearLocationCount: number;
}

// GET /organizations
export interface SponsorOrganizationListItem extends SponsorOrganization, NearStores {
  initials: string;
  priceBasis: PriceBasis;
  eventCount: number;
  sports: string[];
  // To the nearest selected store; null without a search near stores.
  distanceMiles: number | null;
  fanReach: number;
  // The school's size; null when not known.
  studentCount: number | null;
  teacherCount: number | null;
  // Students + teachers (what ATTENDANCE sorts by); null when neither is known.
  expectedAudience: number | null;
  // Games still to come this season.
  upcomingGameCount: number;
  packageCount: number;
  physicalAssetCount: number;
  fromCents: number | null;
  currency: string;
}

export interface SponsorOrganizationSearch {
  items: SponsorOrganizationListItem[];
  // The stores the search used and its radius; null without a search near stores.
  brandLocations: SponsorSelectedLocation[] | null;
  radiusMiles: number | null;
  sort: SponsorSearchSort;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface SponsorEvent {
  id: string;
  exposureEventId: number;
  name: string | null;
  sport: string | null;
  city: string | null;
  state: string | null;
  startDate: string | null;
  endDate: string | null;
}

// GET /organizations/:id/events (tournaments). Near stores are measured from the event's nearest venue.
export interface SponsorEventOption extends SponsorEvent, NearStores {
  inventoryId: string;
  tournamentFormat: string | null;
  tournamentFormatLabel: string | null;
  divisionCount: number;
  teamCount: number;
  games: number;
  isOffered: boolean;
  unavailableReason: UnavailableReason | null;
}

export interface PricingFactor {
  code: string;
  label: string;
  multiplier: number;
  detail: string;
}

export interface PackageSlot {
  activationId: string | null;
  catalogKey: string;
  name: string;
  category: string;
  categoryLabel: string;
  unitValueCents: number;
  lineTotalCents: number;
}

export interface SponsorPackage {
  tier: PackageTier;
  name: string;
  purpose: string;
  description: string;
  isAvailable: boolean;
  unavailableReason: UnavailableReason | null;
  unavailableMessage: string | null;
  slotCount: number;
  slots: PackageSlot[];
  factors: PricingFactor[];
  slotValueTotalCents: number;
  totalCents: number;
  currency: string;
}

export interface SponsorPhysicalAsset {
  activationId: string;
  name: string;
  description: string | null;
  size: string | null;
  // null for an asset made before categories.
  assetCategory: FilterOption | null;
  isAvailable: boolean;
  unavailableReason: UnavailableReason | null;
  unavailableMessage: string | null;
  unitValueCents: number;
  factors: PricingFactor[];
  totalCents: number;
  currency: string;
}

// GET /organizations/:id/packages
export interface SponsorPackages {
  organization: SponsorOrganization;
  event: SponsorEvent | null;
  inventoryId: string;
  inventoryVersion: number;
  priceBasis: {
    basis: PriceBasis;
    basisLabel: string;
    quantity: number;
    teamCount: number;
    tournamentFormat: string | null;
    tournamentFormatLabel: string | null;
    divisions: { divisionId: string | null; name: string | null; teamCount: number; games: number }[];
    // A school's season: its upcoming games are counted from `countedFrom` (today) to the day before
    // `endsBefore`. Dates are YYYY-MM-DD; null for tournaments, club teams and leagues.
    season: { label: string; startsOn: string; endsBefore: string; countedFrom: string } | null;
  };
  currency: string;
  packages: SponsorPackage[];
  physicalAssets: SponsorPhysicalAsset[];
}

// POST /activations: a package (`tier`) or a physical asset (`physicalAssetId`), never both. Stores are
// optional; with them, `radiusMiles` is the radius searched with and every store must be within it.
export interface ActivatePackageRequest {
  schoolId: string;
  tier?: PackageTier;
  physicalAssetId?: string;
  eventId?: string;
  expectedTotalCents?: number;
  sponsorLocationIds?: string[];
  radiusMiles?: number;
}

export interface PackageActivation {
  id: string;
  status: PackageActivationStatus;
  kind: "PACKAGE" | "PHYSICAL_ASSET";
  tier: PackageTier | null;
  packageName: string;
  // The category is kept as it was when activated.
  physicalAsset: { activationId: string | null; size: string | null; assetCategory: FilterOption | null } | null;
  organization: SponsorOrganization;
  event: { id: string; name: string | null } | null;
  // The stores it is for, nearest first; empty when activated without stores.
  locations: SponsorActivationLocation[];
  sponsorFanHubUserId: string | null;
  sponsor: { name: string | null; brandName: string | null };
  inventoryVersion: number;
  priceBasis: PriceBasis;
  basisQuantity: number;
  slotValueTotalCents: number;
  totalCents: number;
  currency: string;
  factors: PricingFactor[];
  lines: Omit<PackageSlot, "categoryLabel">[];
  activatedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  expiredAt: string | null;
}

export interface PackageActivationsPage {
  items: PackageActivation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// A cart item is the body of a single activation.
export type SponsorCartItem = ActivatePackageRequest;

export type SponsorCartKind = "PACKAGE" | "PHYSICAL_ASSET";

// One item as the browser keeps it: the request, plus what was shown when it was added.
export interface SponsorCartLine {
  key: string;
  item: SponsorCartItem;
  kind: SponsorCartKind;
  name: string;
  organization: { id: string; name: string | null; logoUrl: string | null };
  event: { id: string; name: string | null } | null;
  totalCents: number;
  currency: string;
  // The stores the item could be for when it was added (the ones near it in the search) and that search's
  // radius, so the cart can change which of them are attached; absent for items added without stores.
  stores?: { near: SponsorNearLocation[]; radiusMiles: number };
}

// POST /activations/quote
export interface SponsorCartQuoteItem {
  index: number;
  item: SponsorCartItem;
  kind: SponsorCartKind | null;
  name: string | null;
  // null when the organisation no longer sells (`problem` says why).
  organization: SponsorOrganization | null;
  event: { id: string; name: string | null } | null;
  isAvailable: boolean;
  problem: string | null;
  priceChanged: boolean;
  totalCents: number | null;
  currency: string;
  // The item's stores with their distance; empty without stores or with a problem.
  locations: SponsorActivationLocation[];
}

export interface SponsorCartQuote {
  items: SponsorCartQuoteItem[];
  // Every item is available at the price sent.
  canActivate: boolean;
  // The available items at their current prices.
  totalCents: number;
  currency: string;
}

// POST /activations/batch (201, or 200 for a repeated Idempotency-Key).
export interface SponsorCartActivation {
  activations: PackageActivation[];
  totalCents: number;
  currency: string;
}
