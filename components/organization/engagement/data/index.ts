import type { Stat } from "@/components/common/stat-card";

export type CampaignTypeId = "predictions" | "voting" | "challenges" | "quests" | "arcade";

// One row of an engagement settings table: a campaign type (Overview) or a single campaign.
export interface EngagementSetting {
  id: string;
  name: string;
  description: string;
  active: boolean;
  // ISO date the campaign type went live; "" when unknown (shown as just "Live").
  liveSince: string;
  multiplier: boolean;
  // Minimum fans before results show; null for none.
  threshold: number | null;
  // Why the row has no threshold at all, shown instead of the input.
  thresholdNote?: string;
  visibilityLabel: string;
  visibilityHint: string;
  visibility: boolean;
  // A campaign's status as fans see it ("Open", "Closed"…), shown as a badge instead of the Live / Paused line.
  statusBadge?: { label: string; color: string };
  // Resolved, cancelled or an ended challenge: the API refuses any change, so the switches are disabled
  // and only the badge shows.
  statusLocked?: boolean;
  // Why fans don't get the multiplier although the row allows it (its type has it switched off).
  multiplierNote?: string;
}

// SAMPLE DATA — Quests and Arcade have no endpoint yet (they are not part of the engagement API
// release). Overview, Predictions, Voting and Challenges come from the API (engagement-rows).

// A curated row: active, multiplier on, no participation threshold.
const curated = (
  thresholdNote: string,
  id: string,
  name: string,
  description: string,
  liveSince: string,
  visibilityHint: string
): EngagementSetting => ({
  id,
  name,
  description,
  active: true,
  liveSince,
  multiplier: true,
  threshold: null,
  thresholdNote,
  visibilityLabel: "Show Progress",
  visibilityHint,
  visibility: true,
});

// Overview rows for the two types without an API, listed after the three real ones.
export const SAMPLE_CAMPAIGN_TYPES: (EngagementSetting & { id: CampaignTypeId })[] = [
  {
    ...curated(
      "Quests do not require participation threshold",
      "quests",
      "Quests",
      "Fans complete multi-step quests for bigger rewards.",
      "2025-04-10",
      "Show quest progress and completion stats."
    ),
    id: "quests",
  },
  {
    ...curated(
      "Arcade games do not require participation threshold",
      "arcade",
      "Arcade",
      "Fans play arcade games to earn points and rewards.",
      "2025-04-05",
      "Show arcade progress and completion stats."
    ),
    id: "arcade",
  },
];

export const QUEST_STATS: Stat[] = [
  { label: "Available Quests", value: "7", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "4", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 7 available" },
  { label: "Total Started", value: "2,310", tint: "rgba(157,98,193,0.5)", change: 11.2, caption: "vs Last 30 Days" },
  { label: "Avg. Steps Done", value: "3.4", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Of 5 steps per quest" },
  { label: "Completion Rate", value: "44%", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "of started quests" },
];

const quest = (id: string, name: string, description: string, liveSince: string, visibilityHint: string) =>
  curated("Quests do not require participation threshold", id, name, description, liveSince, visibilityHint);

// Quests curated by Dime Droppers that this school can switch on.
export const QUESTS: EngagementSetting[] = [
  quest("season-loyalty", "Season Loyalty", "Attend, vote, and predict across the full season.", "2025-05-01", "Show quest progress and rewards."),
  quest("game-day-hero", "Game-Day Hero", "Complete every game-day activity in a single match.", "2025-05-01", "Show step-by-step progress."),
  quest("triple-threat", "Triple Threat", "Vote, predict, and complete a challenge in one game.", "2025-04-15", "Show progress checklist to fans."),
  quest("fan-of-the-month", "Fan of the Month", "Top engagement across all activities for the month.", "2025-04-10", "Show monthly leaderboard."),
  quest("tournament-champion", "Tournament Champion", "Win predictions across an entire tournament bracket.", "2025-04-05", "Show bracket progress live."),
];

export const ARCADE_STATS: Stat[] = [
  { label: "Available Games", value: "8", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "5", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 8 available" },
  { label: "Total Plays", value: "11,540", tint: "rgba(157,98,193,0.5)", change: 33.8, caption: "vs Last 30 Days" },
  { label: "Avg. Per Fan", value: "8.2", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Per active fan" },
  { label: "Engagement Rate", value: "74%", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "of total fans" },
];

const arcadeGame = (id: string, name: string, description: string, liveSince: string, visibilityHint: string) =>
  curated("Arcade games do not require participation threshold", id, name, description, liveSince, visibilityHint);

// Arcade games curated by Dime Droppers that this school can switch on.
export const ARCADE_GAMES: EngagementSetting[] = [
  arcadeGame("trivia-challenge", "Trivia Challenge", "Quick-fire trivia questions about the team and league.", "2025-05-01", "Show high-score leaderboard."),
  arcadeGame("memory-match", "Memory Match", "Match cards featuring players and team logos.", "2025-05-01", "Show top times."),
  arcadeGame("lightning-round", "Lightning Round", "Answer 10 rapid questions before the clock runs out.", "2025-04-15", "Show fastest-time leaderboard."),
  arcadeGame("free-throw-frenzy", "Free Throw Frenzy", "Tap-to-shoot mini game with seasonal targets.", "2025-04-10", "Show shooter ranks."),
  arcadeGame("quick-pick", "Quick Pick", "Tap your favorite player or play of the night.", "2025-04-05", "Hide pick distribution from fans."),
];
