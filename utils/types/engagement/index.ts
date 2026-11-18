// Engagement console — /fanhub/org/engagement (FANHUB_ORG_ENGAGEMENT_ADMIN.md).

export type EngagementType = "PREDICTION" | "VOTING" | "CHALLENGE";

// A count over all time plus the last 30 days against the 30 before. `deltaPercent` is null when
// the previous window was zero.
export interface EngagementMetric {
  value: number;
  last30Days: number;
  previous30Days: number;
  deltaPercent: number | null;
}

// One Campaign Types row: the organisation's switches for a type.
export interface EngagementTypeSettings {
  type: EngagementType;
  name: string;
  description: string;
  // False for challenges: they have no minimum participation threshold.
  hasParticipationThreshold: boolean;
  isEnabled: boolean;
  // Null when the type was never switched on explicitly (it is live by default).
  enabledAt: string | null;
  multiplierEnabled: boolean;
  minParticipationThreshold: number | null;
  hideActualNumbers: boolean;
  updatedAt: string | null;
}

export interface EngagementTypeRow extends EngagementTypeSettings {
  // Open right now / all non-cancelled campaigns of the type.
  activeCampaigns: number;
  availableCampaigns: number;
}

// GET /overview (data[0]).
export interface EngagementOverview {
  cards: {
    activeCampaigns: { value: number; activeTypes: number; totalTypes: number };
    totalParticipants: EngagementMetric;
    campaignEntries: EngagementMetric & { byType: { predictions: number; votes: number; challenges: number } };
    // Dimes paid to fans for the school's challenges and challenge boosts.
    rewardsDistributed: EngagementMetric;
    // Paid boosts; `activeTypes` = types with the multiplier switched on.
    multiplierUsage: EngagementMetric & { activeTypes: number; totalTypes: number };
  };
  types: EngagementTypeRow[];
}

// PATCH /types/{type} body: at least one field.
export interface EngagementTypePatch {
  isEnabled?: boolean;
  multiplierEnabled?: boolean;
  minParticipationThreshold?: number | null;
  hideActualNumbers?: boolean;
}

// What fans actually get once a campaign's own switches are combined with its type row.
export interface EffectiveEngagement {
  multiplierAllowed: boolean;
  hideActualNumbers: boolean;
  minParticipationThreshold: number | null;
}

// What fans see for a campaign right now, worked out by the API from the switch and the time window.
// OPEN / UPCOMING / CLOSED for all; RESOLVED / CANCELLED for predictions and votes; OFF for challenges.
export type EngagementDisplayStatus = "OPEN" | "UPCOMING" | "CLOSED" | "RESOLVED" | "CANCELLED" | "OFF";

// The fields every tab's campaign rows share.
interface EngagementCampaignBase {
  id: string;
  title: string;
  description: string | null;
  multiplierEnabled: boolean;
  hideActualNumbers: boolean;
  createdAt: string;
  effective: EffectiveEngagement;
  // The row's status text ("Open", "Closed"…); `status` still drives the on/off switch.
  displayStatus: EngagementDisplayStatus;
  displayStatusLabel: string;
}

// What predictions and votes share: made off a game, with a sponsor and a window fans can enter in.
interface GameCampaignFields {
  status: "ACTIVE" | "ENDED" | "RESOLVED" | "CANCELLED";
  // "Presented by …"; null when no sponsor.
  sponsorName: string | null;
  // The game it was made from (null if that game was deleted).
  scheduleEventId: string | null;
  startsAt: string;
  // Entries lock at this time.
  endsAt: string;
  resolvedAt: string | null;
}

export interface PredictionCampaign extends EngagementCampaignBase, GameCampaignFields {
  minParticipationThreshold: number | null;
  entriesCount: number;
  boostedEntriesCount: number;
}

export interface VotingCampaign extends EngagementCampaignBase, GameCampaignFields {
  minParticipationThreshold: number | null;
  votesCount: number;
  boostedVotesCount: number;
}

export interface ChallengeCampaign extends EngagementCampaignBase {
  status: "ACTIVE" | "INACTIVE" | "ENDED";
  // What fans do to make progress.
  category: "DONATION" | "VOTING" | "PREDICTION" | "SCAN_BOOTH";
  criteriaType: "COUNT" | "COUNT_PER_DAY" | "COUNT_DISTINCT_TARGET" | "STREAK_DAYS" | "COUNT_SUCCESSFUL";
  // How many of those actions complete it.
  targetCount: number;
  // Dimes each fan who completes it gets.
  baseDimeReward: number;
  startDate: string | null;
  endDate: string | null;
  // "Presented by …", when the API sends one.
  sponsorName?: string | null;
  // Fans who checked in (started it).
  startedCount: number;
  // Null while the numbers are hidden.
  completedCount: number | null;
}

interface TabStatsBase {
  available: number;
  active: number;
  participants: number;
}

export interface PredictionStats extends TabStatsBase {
  totalEntries: EngagementMetric;
  avgEntriesPerActive: number;
  followers: number;
  engagementRatePercent: number;
}

export interface VotingStats extends TabStatsBase {
  totalVotes: EngagementMetric;
  avgVotesPerActive: number;
  followers: number;
  participationRatePercent: number;
}

export interface ChallengeStats extends TabStatsBase {
  totalCompletions: EngagementMetric;
  avgCompletionsPerFan: number;
  completionRatePercent: number;
}

// GET /predictions, /voting or /challenges (data[0]).
export interface EngagementTabPage<Stats, Item> {
  typeSettings: EngagementTypeSettings;
  stats: Stats;
  items: Item[];
  pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
}

// PATCH body for one campaign. Challenges take no threshold, and toggle ACTIVE / INACTIVE.
export interface EngagementCampaignPatch {
  status?: "ACTIVE" | "ENDED" | "INACTIVE";
  multiplierEnabled?: boolean;
  minParticipationThreshold?: number | null;
  hideActualNumbers?: boolean;
}
