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
export type SponsorSearchSort = "NEAREST" | "NAME" | "FAN_REACH";

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
  venue: FilterOption[];
  // BOYS / GIRLS / COED.
  genders: FilterOption[];
  organizationTypes: FilterOption[];
  sorts: FilterOption[];
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

// GET /organizations
export interface SponsorOrganizationListItem extends SponsorOrganization {
  initials: string;
  priceBasis: PriceBasis;
  eventCount: number;
  sports: string[];
  distanceMiles: number | null;
  fanReach: number;
  packageCount: number;
  physicalAssetCount: number;
  fromCents: number | null;
  currency: string;
}

export interface SponsorOrganizationSearch {
  items: SponsorOrganizationListItem[];
  centre: { latitude: number; longitude: number; label: string; radiusMiles: number } | null;
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

// GET /organizations/:id/events (tournaments)
export interface SponsorEventOption extends SponsorEvent {
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

// POST /activations: a package (`tier`) or a physical asset (`physicalAssetId`), never both.
export interface ActivatePackageRequest {
  schoolId: string;
  tier?: PackageTier;
  physicalAssetId?: string;
  eventId?: string;
  expectedTotalCents?: number;
}

export interface PackageActivation {
  id: string;
  status: PackageActivationStatus;
  kind: "PACKAGE" | "PHYSICAL_ASSET";
  tier: PackageTier | null;
  packageName: string;
  physicalAsset: { activationId: string | null; size: string | null } | null;
  organization: SponsorOrganization;
  event: { id: string; name: string | null } | null;
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
