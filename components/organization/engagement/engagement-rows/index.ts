import type { Stat } from "@/components/common/stat-card";
import type { CampaignTypeId, EngagementSetting } from "@/components/organization/engagement/data";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ChallengeCampaign,
  EngagementCampaignPatch,
  EngagementMetric,
  EngagementOverview,
  EngagementType,
  EngagementTypePatch,
  EngagementTypeRow,
  EngagementDisplayStatus,
  PredictionCampaign,
  VotingCampaign,
} from "@/utils/types/engagement";

// The three tabs backed by the API.
export type EngagementTab = "predictions" | "voting" | "challenges";

const TAB_TYPE: Record<EngagementTab, EngagementType> = { predictions: "PREDICTION", voting: "VOTING", challenges: "CHALLENGE" };

export const TYPE_ID: Record<EngagementType, CampaignTypeId> = { PREDICTION: "predictions", VOTING: "voting", CHALLENGE: "challenges" };

// Challenges show "Show Progress" (the inverse of hideActualNumbers); the others "Hide Actual Numbers".
const VISIBILITY: Record<EngagementType, { label: string; hint: string; inverted: boolean }> = {
  PREDICTION: { label: "Hide Actual Numbers", hint: "Hide leaderboards and live results from fans.", inverted: false },
  VOTING: { label: "Hide Actual Numbers", hint: "Hide poll results and percentages from fans.", inverted: false },
  CHALLENGE: { label: "Show Progress", hint: "Show challenge progress and completion stats.", inverted: true },
};

const NO_THRESHOLD = "Challenges do not require participation threshold";

// Badge colour per display status: open green, upcoming blue, cancelled red, the rest grey.
const STATUS_COLOR: Record<EngagementDisplayStatus, string> = {
  OPEN: "bg-success",
  UPCOMING: "bg-steel-blue",
  CLOSED: "bg-white/30",
  RESOLVED: "bg-white/30",
  CANCELLED: "bg-error/70",
  OFF: "bg-white/30",
};

const TINTS = ["rgba(101,193,98,0.5)", "rgba(99,139,254,0.5)", "rgba(157,98,193,0.5)", "rgba(184,184,184,0.5)", "rgba(184,184,184,0.5)"];

const count = (n: number) => n.toLocaleString("en-US");

// A 30-day comparison card; "—" when the previous 30 days had nothing to compare with.
const metricCard = (label: string, m: EngagementMetric, tint: string): Stat =>
  m.deltaPercent === null
    ? { label, value: count(m.value), tint, caption: "— vs Last 30 Days" }
    : { label, value: count(m.value), tint, change: m.deltaPercent, caption: "vs Last 30 Days" };

// Overview: the five cards of GET /overview.
export function overviewStats(o: EngagementOverview | null): Stat[] {
  if (!o) return ["Active Campaigns", "Total Participants", "Campaign Entries", "Rewards Distributed", "Multiplier Usage"].map((label, i) => ({ label, value: "—", tint: TINTS[i], caption: "" }));
  const { activeCampaigns, totalParticipants, campaignEntries, rewardsDistributed, multiplierUsage } = o.cards;
  return [
    {
      label: "Active Campaigns",
      value: count(activeCampaigns.value),
      tint: TINTS[0],
      caption: `${activeCampaigns.activeTypes} of ${activeCampaigns.totalTypes} campaign types on`,
    },
    metricCard("Total Participants", totalParticipants, TINTS[1]),
    metricCard("Campaign Entries", campaignEntries, TINTS[2]),
    metricCard("Rewards Distributed", rewardsDistributed, TINTS[3]),
    {
      label: "Multiplier Usage",
      value: `${multiplierUsage.activeTypes} Active`,
      tint: TINTS[4],
      caption: `of ${multiplierUsage.totalTypes} campaign types · ${count(multiplierUsage.value)} paid boosts`,
    },
  ];
}

// A Campaign Types row of the Overview.
export function typeRow(t: EngagementTypeRow): EngagementSetting {
  const visibility = VISIBILITY[t.type];
  return {
    id: t.type,
    name: t.name,
    description: `${t.description} ${t.activeCampaigns} open of ${t.availableCampaigns}.`,
    active: t.isEnabled,
    liveSince: t.enabledAt ?? "",
    multiplier: t.multiplierEnabled,
    threshold: t.minParticipationThreshold,
    thresholdNote: t.hasParticipationThreshold ? undefined : NO_THRESHOLD,
    visibilityLabel: visibility.label,
    visibilityHint: visibility.hint,
    visibility: visibility.inverted ? !t.hideActualNumbers : t.hideActualNumbers,
  };
}

type TabCampaign = PredictionCampaign | VotingCampaign | ChallengeCampaign;

// One campaign row of a tab.
export function campaignRow(tab: EngagementTab, c: TabCampaign): EngagementSetting {
  const type = TAB_TYPE[tab];
  const visibility = VISIBILITY[type];
  const base = {
    id: c.id,
    name: c.title,
    active: c.status === "ACTIVE",
    liveSince: c.createdAt,
    multiplier: c.multiplierEnabled,
    // The row allows boosts but its type doesn't, so fans don't get them.
    multiplierNote: c.multiplierEnabled && !c.effective.multiplierAllowed ? "Off for the whole type" : undefined,
    statusBadge: { label: c.displayStatusLabel, color: STATUS_COLOR[c.displayStatus] ?? "bg-white/30" },
    visibilityLabel: visibility.label,
    visibilityHint: visibility.hint,
    visibility: visibility.inverted ? !c.hideActualNumbers : c.hideActualNumbers,
  };

  if (tab === "challenges") {
    const ch = c as ChallengeCampaign;
    const completed = ch.completedCount === null ? "hidden" : count(ch.completedCount);
    return {
      ...base,
      description: [ch.description, `${count(ch.startedCount)} started, ${completed} completed.`].filter(Boolean).join(" "),
      threshold: null,
      thresholdNote: NO_THRESHOLD,
      // An ended challenge can't be switched back on (the toggle only takes ACTIVE / INACTIVE).
      statusLocked: ch.status === "ENDED",
    };
  }

  const pv = c as PredictionCampaign | VotingCampaign;
  const [entries, boosted] =
    tab === "predictions"
      ? [(pv as PredictionCampaign).entriesCount, (pv as PredictionCampaign).boostedEntriesCount]
      : [(pv as VotingCampaign).votesCount, (pv as VotingCampaign).boostedVotesCount];
  const noun = tab === "predictions" ? "entries" : "votes";
  return {
    ...base,
    description: [pv.description, `${count(entries)} ${noun} (${count(boosted)} boosted).`].filter(Boolean).join(" "),
    threshold: pv.minParticipationThreshold,
    // The API refuses any change to a resolved or cancelled prediction / vote.
    statusLocked: pv.status === "RESOLVED" || pv.status === "CANCELLED",
  };
}

type SettingPatch = Partial<Pick<EngagementSetting, "active" | "multiplier" | "threshold" | "visibility">>;

// apiCall toasts a refusal itself; every engagement read is refetched after a change.
async function save(endpoint: string, body: EngagementTypePatch | EngagementCampaignPatch) {
  const { success } = await apiCall({
    endpoint,
    method: "PATCH",
    data: { ...body },
    showSuccessToast: true,
    successMessage: "Saved",
  });
  return success;
}

// The switches on one Campaign Types row: PATCH /types/{type}.
export function saveType(row: EngagementSetting, patch: SettingPatch) {
  const type = row.id as EngagementType;
  const body: EngagementTypePatch = {
    ...(patch.active !== undefined && { isEnabled: patch.active }),
    ...(patch.multiplier !== undefined && { multiplierEnabled: patch.multiplier }),
    ...(patch.threshold !== undefined && { minParticipationThreshold: patch.threshold }),
    ...(patch.visibility !== undefined && { hideActualNumbers: VISIBILITY[type].inverted ? !patch.visibility : patch.visibility }),
  };
  return save(routes.api.engagementType(type), body);
}

const CAMPAIGN_ENDPOINT: Record<EngagementTab, (id: string) => string> = {
  predictions: routes.api.predictionCampaign,
  voting: routes.api.votingCampaign,
  challenges: routes.api.challenge,
};

// The switches on one campaign row, or its status toggle.
export function saveCampaign(tab: EngagementTab, row: EngagementSetting, patch: SettingPatch) {
  const inverted = VISIBILITY[TAB_TYPE[tab]].inverted;
  const off = tab === "challenges" ? "INACTIVE" : "ENDED";
  const body: EngagementCampaignPatch = {
    ...(patch.active !== undefined && { status: patch.active ? "ACTIVE" : off }),
    ...(patch.multiplier !== undefined && { multiplierEnabled: patch.multiplier }),
    ...(patch.threshold !== undefined && { minParticipationThreshold: patch.threshold }),
    ...(patch.visibility !== undefined && { hideActualNumbers: inverted ? !patch.visibility : patch.visibility }),
  };
  return save(CAMPAIGN_ENDPOINT[tab](row.id), body);
}
