// Sponsor packages: /fanhub/sponsor-packages/* (sponsor token). All money is in cents.

import type { OrderPayment, PaymentChoice, SponsorCheckout } from "@/utils/types/sponsor-payments";

export type PackageTier = "COMMUNITY_PARTNER" | "FAN_ENGAGEMENT_PARTNER" | "PRESENTING_PARTNER";
export type SponsorOrganizationType = "SCHOOL" | "TOURNAMENT" | "CLUB_TEAM" | "LEAGUE";
export type PriceBasis = "TEAMS" | "GAMES";
// PENDING_PAYMENT: waiting for its payment (a bank payment clearing, or one still to finish); PAYMENT_FAILED:
// its payment didn't go through. Only ACTIVE / EXPIRED / CANCELLED were bought.
export type PackageActivationStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING_PAYMENT" | "PAYMENT_FAILED";
// TAKEN: every upcoming game of the package already belongs to a sponsor (each part of it is held by one sponsor):
// another sponsor or the caller, the listing doesn't say which (the caller's own shows under GET /activations).
// NO_UPCOMING_GAMES (organisations) / NO_GAMES (events): no games to sell. FULL: every sponsor spot of a physical
// asset is taken (the organisation sets how many).
export type UnavailableReason =
  | "NO_SLOTS"
  | "NO_TEAMS"
  | "NO_GAMES"
  | "NO_UPCOMING_GAMES"
  | "EVENT_ENDED"
  | "TOURNAMENT_INCOMPLETE"
  | "TAKEN"
  | "FULL";
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
  // A tournament's events in the search's scope, open or not.
  eventCount: number;
  // Those of them a sponsor can pick (isOffered on GET /organizations/:id/events). Optional until the backend
  // sends it (docs/SPONSOR_OPEN_EVENT_COUNT_BACKEND_REQUEST.md).
  offeredEventCount?: number;
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

// One game of a package part. `id` is null when the game left the schedule after it was sold; `startsAt` is null
// for a game without a time yet.
export interface SplitGame {
  id: string | null;
  startsAt: string | null;
  title: string | null;
}

// One part of a package: a run of its games (in date order) sold to one sponsor. A TAKEN part hides who has it,
// and its key and price.
export interface PackageSplit {
  // 1, 2, …: in the order of their first game.
  number: number;
  status: "AVAILABLE" | "TAKEN";
  // 16 hex characters, for buying this part; null when TAKEN. Changes whenever its games change.
  splitKey: string | null;
  gameCount: number;
  firstGameAt: string | null;
  lastGameAt: string | null;
  totalCents: number | null;
  games: SplitGame[];
}

// A package, priced by its games: the slot values × the games of a part. Without a max price the package is one
// part with every upcoming game; with one (set by the organisation) it's cut into parts, each up to that price.
// `totalCents`, `factors` and `slots[].lineTotalCents` describe the first available part (every upcoming game
// when none is).
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
  // The price of one game.
  slotValueTotalCents: number;
  totalCents: number;
  currency: string;
  // The organisation's max price per part; null = one part.
  maxPriceCents: number | null;
  // The first available part's key; null when nothing can be bought.
  splitKey: string | null;
  availableSplitCount: number;
  // Every part, in date order.
  splits: PackageSplit[];
}

export interface SponsorPhysicalAsset {
  activationId: string;
  name: string;
  description: string | null;
  size: string | null;
  // null for an asset made before categories.
  assetCategory: FilterOption | null;
  // How many sponsors can buy it (set by the organisation), how many hold it now (paid or being paid) and how
  // many spots are left; each sponsor holds one spot. 0 left: unavailable with reason FULL.
  maxSponsors: number;
  spotsTaken: number;
  spotsLeft: number;
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

// POST /activations: a package (`tier`, and `splitKey` for one part of it; without it, the first available part)
// or a physical asset (`physicalAssetId`), never both. Stores are optional; with them, `radiusMiles` is the radius
// searched with and every store must be within it.
export interface ActivatePackageRequest {
  schoolId: string;
  tier?: PackageTier;
  splitKey?: string;
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
  // The number of games (`games`) for a package.
  basisQuantity: number;
  // The games a package activation's sponsor is shown for; empty for a physical asset, and for a package bought
  // before parts until the backend fills them in.
  games: SplitGame[];
  slotValueTotalCents: number;
  totalCents: number;
  currency: string;
  factors: PricingFactor[];
  lines: Omit<PackageSlot, "categoryLabel">[];
  // Created at first; reset to when it was paid once its payment succeeds.
  activatedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  expiredAt: string | null;
  // How it was paid; absent from an older API.
  payment?: OrderPayment;
}

// POST /activations: the activation and its payment (null for a $0 one, which is live at once).
export type PackageActivationResult = PackageActivation & { checkout: SponsorCheckout | null };

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
  // The package part it is, as it was when added (the quote doesn't return it); absent for a physical asset and
  // for a package added before parts.
  split?: CartSplit;
}

// What the cart shows of a package part: "Part 2 of 3 · 7 games · Dec 19 – Jan 30".
export interface CartSplit {
  number: number;
  of: number;
  gameCount: number;
  firstGameAt: string | null;
  lastGameAt: string | null;
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

// POST /activations/batch body: every item, paid together as one payment.
export type SponsorCartActivateRequest = { items: SponsorCartItem[] } & PaymentChoice;

// POST /activations/batch (201, or 200 for a repeated Idempotency-Key).
export interface SponsorCartActivation {
  activations: PackageActivation[];
  totalCents: number;
  currency: string;
  // The cart's one payment; null for a $0 cart (live at once).
  checkout: SponsorCheckout | null;
}

// GET / PUT /fanhub/org/sponsor-packages/splits (organiser token; `eventId` for a tournament): the max price per
// package and the parts it gives. Physical assets aren't split.
export interface PackageSplitSettings {
  organization: { id: string; name: string | null; organizationType: SponsorOrganizationType };
  event: SponsorEvent | null;
  currency: string;
  // The range a max price can take.
  limits: { maxPriceCentsMin: number; maxPriceCentsMax: number };
  // Every upcoming game, sold or not.
  upcomingGameCount: number;
  packages: PackageSplitSetting[];
}

export interface PackageSplitSetting {
  tier: PackageTier;
  name: string;
  maxPriceCents: number | null;
  // The price of one game of this package.
  perGameCents: number;
  isAvailable: boolean;
  unavailableReason: UnavailableReason | null;
  availableSplitCount: number;
  takenSplitCount: number;
  splits: PackageSplit[];
}

// PUT /fanhub/org/sponsor-packages/splits: the packages to change; null removes the max (one part again).
export interface PackageSplitSettingsInput {
  eventId?: string;
  packages: { tier: PackageTier; maxPriceCents: number | null }[];
}
