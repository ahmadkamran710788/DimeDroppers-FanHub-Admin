// Sponsor AI Agent: /fanhub/org/sponsor-ai/* (organisation token), FANHUB_SPONSOR_AI_FRONTEND.md.
// All money is in cents.

import type { PackageTier } from "@/utils/types/sponsor-packages";

// A problem or warning with the message to show as is.
export interface Notice<C extends string> {
  code: C;
  message: string;
}

export type ReadinessCode =
  | "EVENT_REQUIRED"
  | "NO_PACKAGES"
  | "NO_LOCATION"
  | "NO_VENUES"
  | "NO_SENDER"
  | "SEARCH_UNAVAILABLE";

export interface SponsorAiReadiness {
  ready: boolean;
  eventId: string | null;
  isTournament: boolean;
  packagesReady: boolean;
  location: {
    source: "COORDINATES" | "ADDRESS" | "VENUES" | null;
    label: string | null;
    venueCount: number;
  };
  // The profile contact the emails are signed with, as stored.
  sender: {
    name: string | null;
    position: string | null;
    phone: string | null;
    organisationName: string | null;
  };
  issues: Notice<ReadinessCode>[];
}

export interface SponsorAiCategory {
  category: string;
  score: number;
  recommended: boolean;
  reasons: string[];
}

export interface SponsorAiCategoryOptions {
  // Best first.
  categories: SponsorAiCategory[];
  maxCategories: number;
  radiusOptions: number[];
  defaultRadiusMiles: number;
}

export interface StartRunBody {
  eventId?: string;
  categories?: string[];
  radiusMiles?: number;
}

export type RunStatus =
  | "QUEUED"
  | "SEARCHING"
  | "SCORING"
  | "ENRICHING"
  | "DRAFTING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED_NO_PACKAGES";

export type RunErrorCode =
  | "SEARCH_UNAVAILABLE"
  | "CONTACT_LOOKUP_UNAVAILABLE"
  | "LOCATION_NOT_FOUND"
  | "DRAFTING_UNAVAILABLE"
  | "STALE"
  | "INTERNAL";

export type RunWarningCode = "PARTIAL_RESULTS" | "CONTACT_LOOKUP_UNAVAILABLE" | "WEB_CHECK_UNAVAILABLE" | "DRAFTING_PARTIAL";

// One search: its stage and how many businesses made it through each one.
export interface SponsorAiRun {
  id: string;
  eventId: string | null;
  status: RunStatus;
  // [] when the four recommended categories were used.
  categories: string[];
  radiusMiles: number;
  foundCount: number;
  candidateCount: number;
  qualifiedCount: number;
  noContactCount: number;
  draftedCount: number;
  failedSearchCount: number;
  error: Notice<RunErrorCode> | null;
  warnings: Notice<RunWarningCode>[];
  startedAt: string;
  completedAt: string | null;
}

export interface SponsorAiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SponsorAiRunList {
  items: SponsorAiRun[];
  pagination: SponsorAiPagination;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DraftStatusFilter = ReviewStatus | "ALL";

// A package as it was when the email was written, its placements grouped by Activations column.
export interface DraftPackage {
  tier: PackageTier;
  name: string;
  purpose: string;
  description: string;
  totalCents: number;
  currency: string;
  slotCount: number;
  // category: "Pre Game" | "Live" | "Post Game" | "Add-ons".
  placements: { category: string; placements: string[] }[];
  recommended: boolean;
}

// One business and the email the agent wrote it; `id` is the thread id every draft route takes.
export interface SponsorDraft {
  id: string;
  reviewStatus: ReviewStatus;
  threadStatus: "DRAFT" | "ACTIVE" | "REPLIED" | "STOPPED" | "REJECTED";
  // Tournaments only.
  event: { id: string; name: string | null } | null;
  business: {
    prospectId: string;
    name: string;
    category: string;
    city: string | null;
    state: string | null;
    distanceMiles: number | null;
    website: string | null;
    phone: string | null;
    fitScore: number;
    fitReasons: string[];
  };
  contact: {
    id: string;
    name: string | null;
    title: string | null;
    email: string | null;
    verification: "VERIFIED" | "PROBABLE" | "UNVERIFIED" | "NEEDS_REVIEW" | "INVALID";
  } | null;
  message: {
    id: string;
    subject: string | null;
    // Plain text with \n line breaks, ending with the signature.
    body: string | null;
    humanEdited: boolean;
    aiModel: string | null;
  } | null;
  recommendation: {
    tier: PackageTier;
    name: string;
    totalCents: number;
    matchedFitScore: boolean;
    reason: string;
  } | null;
  // Smallest first.
  packages: DraftPackage[];
  createdAt: string;
  updatedAt: string;
}

export interface SponsorDraftList {
  items: SponsorDraft[];
  // Every draft of the organisation (or event), whatever status was asked for.
  counts: Record<DraftStatusFilter, number>;
  pagination: SponsorAiPagination;
}

export interface EditDraftBody {
  subject?: string;
  body?: string;
}

// Why a draft was left out of an approve / reject call (reject only returns the first two).
export type DraftSkipReason = "NOT_FOUND" | "NOT_PENDING" | "NO_EMAIL" | "SUPPRESSED";

export interface DraftBatchResult {
  done: string[];
  skipped: { id: string; reason: DraftSkipReason }[];
}

// Sponsor Messages: /threads, FANHUB_SPONSOR_AI_FRONTEND_SPONSOR_MESSAGES.md. A conversation is listed
// once its first email has gone out.

export type ConversationStatus = "ACTIVE" | "REPLIED" | "STOPPED";
export type ConversationStatusFilter = ConversationStatus | "ALL";
export type StopReason = "ORGANISATION" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINT" | "SUPPRESSED";
export type MessageSender = "ORGANISATION" | "SPONSOR";
export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "FAILED" | "RECEIVED";

export interface ThreadSummary {
  id: string;
  status: ConversationStatus;
  // Set when STOPPED.
  stopReason: StopReason | null;
  subject: string;
  // Tournaments only.
  event: { id: string; name: string | null } | null;
  business: {
    prospectId: string;
    name: string;
    category: string;
    city: string | null;
    state: string | null;
    fitScore: number;
  };
  // null on old rows.
  contact: { id: string; name: string | null; title: string | null; email: string | null } | null;
  recommendation: {
    tier: PackageTier;
    name: string;
    totalCents: number;
    matchedFitScore: boolean;
    reason: string;
  } | null;
  lastMessage: {
    direction: "OUTBOUND" | "INBOUND";
    sender: MessageSender;
    // One line, at most 160 characters.
    preview: string;
    at: string;
  } | null;
  // Emails sent and replies received.
  messageCount: number;
  replyCount: number;
  // Only while ACTIVE and a follow-up is still planned.
  nextFollowUpAt: string | null;
  lastActivityAt: string;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  direction: "OUTBOUND" | "INBOUND";
  kind: "INITIAL" | "FOLLOW_UP" | "REPLY";
  // `name` is null when someone other than the contact replied.
  sender: { type: MessageSender; name: string | null; email: string | null };
  subject: string | null;
  // Plain text with \n line breaks; a reply holds only the new text.
  body: string | null;
  status: MessageStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface ThreadDetail extends ThreadSummary {
  // The packages saved with the first email.
  packages: DraftPackage[];
  // Oldest first.
  messages: ThreadMessage[];
}

export interface ThreadList {
  items: ThreadSummary[];
  // Every conversation of the organisation (or event), whatever status or search was asked for.
  counts: Record<ConversationStatusFilter, number>;
  pagination: SponsorAiPagination;
}
