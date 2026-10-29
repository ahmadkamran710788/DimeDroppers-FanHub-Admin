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

export interface DraftBatchResult {
  done: string[];
  skipped: { id: string; reason: "NOT_FOUND" | "NOT_PENDING" }[];
}
