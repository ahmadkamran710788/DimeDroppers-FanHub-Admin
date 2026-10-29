import { CATEGORY_LABELS } from "@/components/sponsor/find-organizations/data";
import { routes } from "@/utils/routes";
import type {
  DraftPackage,
  DraftSkipReason,
  DraftStatusFilter,
  ReadinessCode,
  ReviewStatus,
  RunStatus,
  SponsorDraft,
} from "@/utils/types/sponsor-ai";
import type { PackageSlot, SponsorPackage } from "@/utils/types/sponsor-packages";

// A search takes 1–4 minutes; its status is checked this often until it's final.
export const POLL_MS = 4000;

// The backend only marks a search that stopped moving as failed when the next one starts, so after
// this long Find Sponsors is offered again.
export const STUCK_AFTER_MS = 15 * 60 * 1000;

export const DRAFTS_PER_PAGE = 20;

// The most ids one approve call takes.
export const APPROVE_BATCH_MAX = 100;

// Whose sponsors the page is about: the organisation, or one of a tournament's events.
export interface AgentScope {
  isTournament: boolean;
  // The tournament's picked event; undefined for a school.
  eventId?: string;
}

// What the searches and drafts are keyed by: the event, or "org" for a school. "" while there is
// nothing to load (the org type isn't known yet, or a tournament hasn't picked an event).
export const scopeKey = (scope: AgentScope | null) =>
  !scope ? "" : scope.isTournament ? (scope.eventId ?? "") : "org";

// The stages a search goes through, in order (QUEUED comes before the first).
export const RUN_STAGES: { status: RunStatus; label: string }[] = [
  { status: "SEARCHING", label: "Finding businesses near you" },
  { status: "SCORING", label: "Scoring businesses" },
  { status: "ENRICHING", label: "Finding the right contact" },
  { status: "DRAFTING", label: "Writing emails" },
];

const ACTIVE_RUN: ReadonlySet<RunStatus> = new Set(["QUEUED", "SEARCHING", "SCORING", "ENRICHING", "DRAFTING"]);
export const isActiveRun = (status: RunStatus | undefined) => !!status && ACTIVE_RUN.has(status);

export const STATUS_STYLE: Record<ReviewStatus, { label: string; color: string; text: string }> = {
  PENDING: { label: "Draft", color: "bg-[#3d2a12]", text: "text-[#ffc999]" },
  APPROVED: { label: "Approved · Sent", color: "bg-[#1d3a1e]", text: "text-[#a3e3a5]" },
  REJECTED: { label: "Rejected", color: "bg-[#3f1416]", text: "text-[#ffa3a3]" },
};

// An approved draft's state, from its thread: ACTIVE is queued or sent with no answer yet.
export const THREAD_STYLE: Partial<Record<SponsorDraft["threadStatus"], { label: string; color: string; text: string }>> = {
  ACTIVE: { label: "Sent", color: "bg-[#1d3a1e]", text: "text-[#a3e3a5]" },
  REPLIED: { label: "Replied", color: "bg-[#1b2f4a]", text: "text-[#a9d1ff]" },
  STOPPED: { label: "Stopped", color: "bg-[#3d2a12]", text: "text-[#ffc999]" },
};

// What to tell the organiser about a draft approve left out. NOT_PENDING is silent: it's already on another tab.
export const APPROVE_SKIP_MESSAGE: Record<DraftSkipReason, string | null> = {
  NOT_PENDING: null,
  NOT_FOUND: "This draft no longer exists",
  NO_EMAIL: "No email address for this business",
  SUPPRESSED: "This contact asked not to be emailed",
};

// The status filter's choices, in the design's order; each label gets its count.
export const STATUS_FILTERS: { value: DraftStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Drafts" },
  { value: "APPROVED", label: "Approved & sent" },
  { value: "REJECTED", label: "Rejected" },
];

// Where the organisation fixes what stops a search. EVENT_REQUIRED has none: the event picker is above.
export const ISSUE_ACTIONS: Partial<Record<ReadinessCode, { label: string; href: string }>> = {
  NO_PACKAGES: { label: "Set up packages", href: routes.ui.inventory },
  NO_LOCATION: { label: "Open profile", href: routes.ui.profile },
  NO_SENDER: { label: "Open profile", href: routes.ui.profile },
  NO_VENUES: { label: "Open venues", href: routes.ui.venues },
};

// "Pre Game" → "PRE_GAME": the drafts name each placement column, PackageCard colours it by code.
const CATEGORY_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([code, label]) => [label, code])
);

// A draft's package (placements grouped by column) as PackageCard shows it. Prices aren't split per
// placement in a draft, so only the total is set.
export function toSponsorPackage(p: DraftPackage): SponsorPackage {
  const slots: PackageSlot[] = p.placements.flatMap((group) => {
    const code = CATEGORY_CODES[group.category] ?? group.category;
    return group.placements.map((name) => ({
      activationId: null,
      catalogKey: `${code}-${name}`,
      name,
      category: code,
      categoryLabel: group.category,
      unitValueCents: 0,
      lineTotalCents: 0,
    }));
  });
  return {
    tier: p.tier,
    name: p.name,
    purpose: p.purpose,
    description: p.description,
    isAvailable: true,
    unavailableReason: null,
    unavailableMessage: null,
    slotCount: p.slotCount,
    slots,
    factors: [],
    slotValueTotalCents: p.totalCents,
    totalCents: p.totalCents,
    currency: p.currency,
  };
}
