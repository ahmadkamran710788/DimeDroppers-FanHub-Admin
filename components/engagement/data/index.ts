import type { Stat } from "@/components/common/stat-card";

export type CampaignTypeId = "predictions" | "voting" | "challenges" | "quests" | "arcade";

// One row of an engagement settings table: a campaign type (Overview) or a single prediction.
export interface EngagementSetting {
  id: string;
  name: string;
  description: string;
  active: boolean;
  // ISO date the campaign type went live.
  liveSince: string;
  multiplier: boolean;
  // Minimum fans before results show; null when the type has no threshold.
  threshold: number | null;
  // Why there is no threshold, shown instead of the input.
  thresholdNote?: string;
  visibilityLabel: string;
  visibilityHint: string;
  visibility: boolean;
}

// Sample numbers until the engagement API exists.
export const ENGAGEMENT_STATS: Stat[] = [
  { label: "Active Campaigns", value: "4", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "of 5 campaign types" },
  { label: "Total Participants", value: "9,842", tint: "rgba(99,139,254,0.5)", change: -18.6, caption: "vs Last 30 Days" },
  { label: "Campaign Entries", value: "24,651", tint: "rgba(157,98,193,0.5)", change: 22.3, caption: "vs Last 30 Days" },
  { label: "Rewards Distributed", value: "3,215", tint: "rgba(184,184,184,0.5)", change: 15.7, caption: "vs Last 30 Days" },
  { label: "Multiplier Usage", value: "2 Active", tint: "rgba(184,184,184,0.5)", caption: "of 5 campaign types" },
];

export const ENGAGEMENT_CAMPAIGN_TYPES: (EngagementSetting & { id: CampaignTypeId })[] = [
  {
    id: "predictions",
    name: "Predictions",
    description: "Fans make predictions about game outcomes and events.",
    active: true,
    liveSince: "2025-05-01",
    multiplier: true,
    threshold: 25,
    visibilityLabel: "Hide Actual Numbers",
    visibilityHint: "Hide leaderboards and live results from fans.",
    visibility: true,
  },
  {
    id: "voting",
    name: "Voting",
    description: "Fans vote on polls and decisions.",
    active: true,
    liveSince: "2025-04-20",
    multiplier: true,
    threshold: 50,
    visibilityLabel: "Hide Actual Numbers",
    visibilityHint: "Hide poll results and percentages from fans.",
    visibility: true,
  },
  {
    id: "challenges",
    name: "Challenges",
    description: "Fans complete challenges to earn points and rewards.",
    active: true,
    liveSince: "2025-04-15",
    multiplier: true,
    threshold: null,
    thresholdNote: "Challenges do not require participation threshold",
    visibilityLabel: "Show Progress",
    visibilityHint: "Show challenge progress and completion stats.",
    visibility: true,
  },
  {
    id: "quests",
    name: "Quests",
    description: "Fans complete multi-step quests for bigger rewards.",
    active: true,
    liveSince: "2025-04-10",
    multiplier: true,
    threshold: null,
    thresholdNote: "Quests do not require participation threshold",
    visibilityLabel: "Show Progress",
    visibilityHint: "Show quest progress and completion stats.",
    visibility: true,
  },
  {
    id: "arcade",
    name: "Arcade",
    description: "Fans play arcade games to earn points and rewards.",
    active: true,
    liveSince: "2025-04-05",
    multiplier: true,
    threshold: null,
    thresholdNote: "Arcade games do not require participation threshold",
    visibilityLabel: "Show Progress",
    visibilityHint: "Show arcade progress and completion stats.",
    visibility: true,
  },
];

export const PREDICTION_STATS: Stat[] = [
  { label: "Available Predictions", value: "12", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "8", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 12 available" },
  { label: "Total Entries", value: "6,420", tint: "rgba(157,98,193,0.5)", change: 22.3, caption: "vs Last 30 Days" },
  { label: "Avg. Entries", value: "803", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Per active prediction" },
  { label: "Engagement Rate", value: "68%", tint: "rgba(184,184,184,0.5)", caption: "of total fans" },
];

// A curated row (prediction or poll): active, multiplier on, with a threshold and hidden numbers.
const curated = (
  id: string,
  name: string,
  description: string,
  liveSince: string,
  threshold: number,
  visibilityHint: string
): EngagementSetting => ({
  id,
  name,
  description,
  active: true,
  liveSince,
  multiplier: true,
  threshold,
  visibilityLabel: "Hide Actual Numbers",
  visibilityHint,
  visibility: true,
});

// Predictions curated by Dime Droppers that this school can switch on.
export const PREDICTIONS: EngagementSetting[] = [
  curated("game-winner", "Game Winner", "Fans predict the winning team before the game.", "2025-05-01", 25, "Hide leaderboards and live results from fans."),
  curated("final-score", "Final Score", "Fans predict the exact final score of the game.", "2025-05-01", 30, "Hide score predictions until reveal."),
  curated("mvp", "MVP of the Game", "Fans predict who will be voted Most Valuable Player.", "2025-04-15", 20, "Hide pick distribution from fans."),
  curated("first-score", "First Score", "Fans predict which team will score first.", "2025-04-10", 15, "Hide first-score pick distribution."),
  curated("coin-toss", "Coin Toss", "Fans predict the result of the coin toss before the game.", "2025-04-05", 10, "Hide coin-toss pick distribution."),
];

export const VOTING_STATS: Stat[] = [
  { label: "Available Polls", value: "10", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "6", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 10 available" },
  { label: "Total Votes", value: "4,820", tint: "rgba(157,98,193,0.5)", change: 19.5, caption: "vs Last 30 Days" },
  { label: "Avg. Votes", value: "803", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Per active poll" },
  { label: "Participation Rate", value: "72%", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "of total fans" },
];

// Polls curated by Dime Droppers that this school can switch on.
export const POLLS: EngagementSetting[] = [
  curated("player-of-the-game", "Player of the Game", "Fans vote for the standout performer of the match.", "2025-05-01", 30, "Hide vote tally until reveal."),
  curated("most-hyped-moment", "Most Hyped Moment", "Fans pick the highlight moment of the game.", "2025-05-01", 25, "Hide vote distribution from fans."),
  curated("best-play", "Best Play", "Fans vote for the best play of the night.", "2025-04-15", 20, "Hide leaderboards during voting."),
  curated("halftime-show", "Halftime Show", "Fans rate the halftime show performance.", "2025-04-10", 15, "Hide ratings until close."),
  curated("captains-choice", "Captain's Choice", "Fans nominate the next team captain.", "2025-04-05", 10, "Hide candidate tallies."),
];

export const CHALLENGE_STATS: Stat[] = [
  { label: "Available Challenges", value: "9", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "5", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 9 available" },
  { label: "Total Completions", value: "8,140", tint: "rgba(157,98,193,0.5)", change: 27.4, caption: "vs Last 30 Days" },
  { label: "Avg. Per Fan", value: "12", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Per active fan" },
  { label: "Completion Rate", value: "61%", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "of total participants" },
];

// Builds curated rows that have no participation threshold (challenges, quests, arcade), with the note shown instead.
const withoutThreshold =
  (thresholdNote: string) =>
  (id: string, name: string, description: string, liveSince: string, visibilityHint: string): EngagementSetting => ({
    ...curated(id, name, description, liveSince, 0, visibilityHint),
    threshold: null,
    thresholdNote,
  });

const challenge = withoutThreshold("Challenges do not require participation threshold");

// Challenges curated by Dime Droppers that this school can switch on.
export const CHALLENGES: EngagementSetting[] = [
  challenge("spirit-streak", "Spirit Streak", "Attend 5 games in a row to complete the streak.", "2025-05-01", "Show streak progress to fans."),
  challenge("game-day-trivia", "Game Day Trivia", "Answer trivia questions correctly during the game.", "2025-05-01", "Show completion stats to fans."),
  challenge("photo-challenge", "Photo Challenge", "Share game-day photos for community points.", "2025-04-15", "Show top photos in feed."),
  challenge("score-match", "Score Match Challenge", "Predict the final score correctly within ±3.", "2025-04-10", "Hide score predictions until reveal."),
  challenge("social-share", "Social Share", "Share team content on social media to earn points.", "2025-04-05", "Show share counts on profile."),
];

export const QUEST_STATS: Stat[] = [
  { label: "Available Quests", value: "7", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "Curated by Dime Droppers" },
  { label: "Active", value: "4", tint: "rgba(99,139,254,0.5)", trend: "down", caption: "of 7 available" },
  { label: "Total Started", value: "2,310", tint: "rgba(157,98,193,0.5)", change: 11.2, caption: "vs Last 30 Days" },
  { label: "Avg. Steps Done", value: "3.4", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "Of 5 steps per quest" },
  { label: "Completion Rate", value: "44%", tint: "rgba(184,184,184,0.5)", trend: "up", caption: "of started quests" },
];

const quest = withoutThreshold("Quests do not require participation threshold");

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

const arcadeGame = withoutThreshold("Arcade games do not require participation threshold");

// Arcade games curated by Dime Droppers that this school can switch on.
export const ARCADE_GAMES: EngagementSetting[] = [
  arcadeGame("trivia-challenge", "Trivia Challenge", "Quick-fire trivia questions about the team and league.", "2025-05-01", "Show high-score leaderboard."),
  arcadeGame("memory-match", "Memory Match", "Match cards featuring players and team logos.", "2025-05-01", "Show top times."),
  arcadeGame("lightning-round", "Lightning Round", "Answer 10 rapid questions before the clock runs out.", "2025-04-15", "Show fastest-time leaderboard."),
  arcadeGame("free-throw-frenzy", "Free Throw Frenzy", "Tap-to-shoot mini game with seasonal targets.", "2025-04-10", "Show shooter ranks."),
  arcadeGame("quick-pick", "Quick Pick", "Tap your favorite player or play of the night.", "2025-04-05", "Hide pick distribution from fans."),
];
