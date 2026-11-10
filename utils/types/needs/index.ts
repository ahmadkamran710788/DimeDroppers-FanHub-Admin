// Fundable Needs as the API sends them (docs/endpoints/FANHUB_FUNDABLE_NEEDS_FRONTEND.md), for the
// organisation panel and the sponsor app. Money is in integer cents throughout.

export type NeedStatus = "OPEN" | "FUNDED" | "ENDED" | "CLOSED" | "CANCELLED";
export type NeedScope = "GAME" | "EVENT";
export type CardStatus = "PENDING" | "INACTIVE" | "ACTIVE" | "CANCELED" | "FAILED";
export type ContributionStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
export type BrandDisplay = "LOGO_FULL_COLOR" | "LOGO_ONE_COLOR" | "NAME_ONLY";
export type NeedSponsorSort = "CLOSING_SOONEST" | "NEWEST" | "NEAREST";

// A store type the need's card may be used at (a Stripe Issuing merchant category).
export interface MerchantCategory {
  stripeCategory: string;
  label: string;
  mcc: string | null;
}

export interface NeedMoney {
  goalCents: number;
  raisedCents: number;
  spentCents: number;
  // Card purchases approved but not settled yet.
  pendingCents: number;
  refundedCents: number;
  // What the card can still spend.
  availableCents: number;
  // What sponsors can still give.
  remainingToGoalCents: number;
  progressPercent: number;
}

export interface Need {
  id: string;
  title: string;
  description: string;
  whyItMatters: string | null;
  category: { code: string; name: string };
  allowedCategories: MerchantCategory[];
  scope: NeedScope;
  // Filled for a tournament's need; `game` for a school's.
  event: { id: string; name: string | null; startDate: string | null; endDate: string | null } | null;
  game: {
    id: string;
    title: string | null;
    opponent: string | null;
    utcTime: string | null;
    homeAway: string | null;
    sports: string | null;
  } | null;
  team: { id: string; name: string } | null;
  endsAt: string;
  // Whole days until endsAt; 0 once it has passed.
  daysLeft: number;
  status: NeedStatus;
  // Only then may a sponsor fund it.
  acceptingContributions: boolean;
  spendingOpen: boolean;
  allocationStrategy: "PROPORTIONAL" | "FIRST_IN_FIRST_OUT";
  money: NeedMoney;
  location: { city: string | null; state: string | null };
  sponsorCount: number;
  fundedAt: string | null;
  endedAt: string | null;
  refundAfter: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface Contribution {
  id: string;
  amountCents: number;
  utilizedCents: number;
  refundedCents: number;
  remainingCents: number;
  status: ContributionStatus;
  brandDisplay: BrandDisplay;
  note: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// --- Sponsor app ---

export interface NeedOrganization {
  id: string;
  name: string | null;
  // A signed link, valid for an hour.
  logoUrl: string | null;
  city: string | null;
  state: string | null;
}

// One of the sponsor's own stores near the need.
export interface NearLocation {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  distanceMiles: number;
}

// GET /fanhub/sponsor-needs: an open need.
export interface SponsorNeedListItem extends Need {
  organization: NeedOrganization;
  nearLocations: NearLocation[];
  nearLocationCount: number;
  cardStatus: CardStatus | null;
}

// GET /fanhub/sponsor-needs/summary: the Browse stat cards.
export interface SponsorNeedsSummary {
  openNeedCount: number;
  // Of those, closing in the next 10 days.
  closingSoonCount: number;
  stillNeededCents: number;
  organizationCount: number;
  // All time.
  fundedByYouCents: number;
  fundedNeedCount: number;
}

// POST /fanhub/sponsor-needs/:needId/contributions body.
export interface StartContributionRequest {
  amountCents: number;
  brandDisplay: BrandDisplay;
  note?: string;
}

// POST /fanhub/sponsor-needs/:needId/contributions: the payment, ready for Stripe's Payment Element.
export interface StartContributionResult {
  contribution: Contribution;
  clientSecret: string;
  paymentIntentId: string;
}

// GET /fanhub/sponsor-needs/funded: one row per need the sponsor has paid for.
export interface SponsorFundedNeed {
  need: Need;
  organization: NeedOrganization;
  yourContributionCents: number;
  yourUtilizedCents: number;
  yourRefundedCents: number;
  yourRemainingCents: number;
  firstPaidAt: string;
  lastPaidAt: string;
}

// A purchase on the need's card and this sponsor's part of it (negative for a merchant refund).
export interface UtilizationTransaction {
  id: string;
  type: "CAPTURE" | "REFUND";
  amountCents: number;
  merchantName: string | null;
  merchantCategory: string | null;
  merchantCategoryCode: string | null;
  merchantCity: string | null;
  merchantState: string | null;
  occurredAt: string;
  unallocatedCents: number;
  yourShareCents: number;
}

// Unused money sent back to the sponsor after the need closed.
export interface UtilizationRefund {
  id?: string;
  amountCents: number;
  status: string;
  createdAt?: string;
}

// GET /fanhub/sponsor-needs/:needId/utilization: where the sponsor's money went.
export interface NeedUtilization {
  needId: string;
  allocationStrategy: Need["allocationStrategy"];
  yourContributionCents: number;
  totalRaisedCents: number;
  totalSpentCents: number;
  totalPendingCents: number;
  yourUtilizedCents: number;
  yourRefundedCents: number;
  yourRemainingCents: number;
  refunds: UtilizationRefund[];
  transactions: UtilizationTransaction[];
  pagination: Paged<UtilizationTransaction>["pagination"];
}

// --- Organisation panel ---

// The need's virtual card (organisation only). One card per category, reused for the organisation's next
// need in that category once the previous one has finished.
export interface NeedCard {
  id: string;
  currentNeedId: string | null;
  stripeCardId: string | null;
  status: CardStatus;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  // Includes earlier needs' spend on a reused card: show the need's raised amount instead.
  spendingLimitCents: number;
  allowedCategories: MerchantCategory[];
  frozen: boolean;
  frozenAt: string | null;
  // Why set-up failed (status FAILED); the system retries by itself.
  error: string | null;
  activatedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  // false: the card has moved on to a newer need; for an older need it is history only.
  servesThisNeed: boolean;
  // The one flag to trust for "the card works now".
  readyToSpend: boolean;
}

export interface SponsorBrand {
  id: string;
  name: string | null;
  // A signed link, valid for an hour.
  logoUrl: string | null;
}

// A sponsor of a need, with everything they paid summed.
export interface FundingSponsor extends SponsorBrand {
  totalCents: number;
  brandDisplay: BrandDisplay;
}

// One entry of a card's history (newest first). DECLINED moved no money.
export interface NeedActivity {
  id: string;
  kind: "CAPTURE" | "REFUND" | "DECLINED";
  amountCents: number;
  merchantName: string | null;
  merchantCategory: string | null;
  merchantCategoryCode: string | null;
  declineReason: string | null;
  declineLabel: string | null;
  occurredAt: string;
}

// GET /fanhub/org/needs (paged) and the freeze / unfreeze answers.
export interface OrgNeedListItem extends Need {
  card: NeedCard | null;
  sponsors: FundingSponsor[];
}

// GET /fanhub/org/needs/:id: every sponsor payment (with the sponsor's note) and the card's history.
export interface OrgNeedDetail extends OrgNeedListItem {
  contributions: (Contribution & { sponsor: SponsorBrand })[];
  activity: NeedActivity[];
}

// GET /fanhub/org/needs/cards (paged): a card, its category, and the need it serves now (null between needs).
export interface OrgCardListItem {
  card: NeedCard;
  category: { code: string; name: string };
  needCount: number;
  currentNeed: Need | null;
}

// GET /fanhub/org/needs/summary: the page's stat cards.
export interface OrgNeedsSummary {
  needCount: number;
  awaitingSponsorCount: number;
  raisedCents: number;
  sponsorshipCount: number;
  spentCents: number;
  cardCount: number;
  availableCents: number;
  refundedCents: number;
}

export interface NeedCategoryOption {
  code: string;
  name: string;
  // false: shown as "Coming soon".
  isEnabled: boolean;
  allowedCategories: MerchantCategory[];
}

// An event of a tournament that hasn't ended (the need ends at endsAt).
export interface NeedEventOption {
  id: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  endsAt: string;
  city: string | null;
  state: string | null;
}

// GET /fanhub/org/needs/options: what the create form offers. A tournament picks an event (scope EVENT), a
// school picks a game (scope GAME, events empty).
export interface NeedOptions {
  organizationKind: string;
  scope: NeedScope;
  categories: NeedCategoryOption[];
  events: NeedEventOption[];
  brandDisplays: BrandDisplay[];
  limits: { goalCentsMin: number; goalCentsMax: number; contributionCentsMin: number };
}

// GET /fanhub/org/needs/teams: answered as the array itself in `data`.
export interface NeedTeam {
  id: string;
  name: string;
  sport: string | null;
  level: string | null;
  gender: string | null;
  division: string | null;
}

// GET /fanhub/org/needs/games (paged, school only): a game that isn't over yet.
export interface NeedGame {
  id: string;
  title: string | null;
  opponent: string | null;
  sports: string | null;
  homeAway: string | null;
  location: string | null;
  utcTime: string | null;
  // Funding and spending close then (3 hours after the start).
  endsAt: string | null;
  team: { id: string; name: string } | null;
}

// POST /fanhub/org/needs: eventId for a tournament, scheduleEventId (the game) for a school.
export interface CreateNeedRequest {
  categoryCode: string;
  eventId?: string;
  scheduleEventId?: string;
  teamId: string | null;
  title: string;
  description: string;
  whyItMatters?: string;
  goalCents: number;
}

// PATCH /fanhub/org/needs/:id: only what changed; whyItMatters null clears it.
export interface UpdateNeedRequest {
  title?: string;
  description?: string;
  whyItMatters?: string | null;
  goalCents?: number;
}
