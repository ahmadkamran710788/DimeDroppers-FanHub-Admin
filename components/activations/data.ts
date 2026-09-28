import type { SavedSchool } from "@/utils/types/school";

export interface Activation {
  id: string;
  title: string;
  description: string;
  recommended?: boolean;
  // Shown on the dashboard Activations page only (not the Setup Wizard). These have no
  // backend feature-link field yet, so they're absent from FEATURE_LINK_KEY and not saved.
  dashboardOnly?: boolean;
}

export interface Category {
  id: "game-day" | "support" | "engage";
  label: string;
  description: string;
  // Card background (semi-transparent brand tint).
  color: string;
  // Solid colour used for the donut segment + legend dot.
  accent: string;
  activations: Activation[];
}

export const CATEGORIES: Category[] = [
  {
    id: "game-day",
    label: "Game Day",
    description: "Essential game information, access and live experiences.",
    color: "rgba(99,139,254,0.5)",
    accent: "#638BFE",
    activations: [
      { id: "buy-tickets", title: "Buy Tickets", description: "Sell tickets directly in your Fan Hub.", recommended: true },
      { id: "watch-game", title: "Watch Game", description: "Live stream games and events.", recommended: true },
      { id: "partner-offers", title: "Partner Offers", description: "Showcase offers from your partners." },
      { id: "highlights-stats", title: "Highlights & Stats", description: "Game highlights, stats and recaps.", recommended: true },
      { id: "team-info", title: "Team Info", description: "Roster, standings, news and more.", recommended: true, dashboardOnly: true },
      { id: "engage-live", title: "Engage Live", description: "Live scoring, updates and alerts.", recommended: true, dashboardOnly: true },
    ],
  },
  {
    id: "support",
    label: "Support",
    description: "Drive support and raise funds for your teams.",
    color: "rgba(101,193,98,0.4)",
    accent: "#65C162",
    activations: [
      { id: "support-team", title: "Support a Team", description: "Accept donations and support.", recommended: true },
      { id: "shout-out-wall", title: "Shout Out Wall", description: "Fans can send messages and shout outs.", recommended: true },
      { id: "team-stores", title: "Team Stores", description: "Sell team merchandise." },
      { id: "record-game", title: "Record Game", description: "Record games for your team.", recommended: true },
      { id: "score-game", title: "Score Game", description: "Live scoring and game updates.", recommended: true },
    ],
  },
  {
    id: "engage",
    label: "Engage",
    description: "Interactive fun that keeps fans coming back.",
    color: "rgba(157,98,193,0.4)",
    accent: "#9D62C1",
    activations: [
      { id: "predict", title: "Predict", description: "Make predictions and win points.", recommended: true },
      { id: "vote", title: "Vote", description: "Vote in polls and fan votes.", recommended: true },
      { id: "arcade", title: "Arcade", description: "Play fun games and earn points." },
      { id: "challenges-quests", title: "Challenges & Quests", description: "Complete challenges and earn rewards.", recommended: true },
      { id: "fan-wall", title: "Fan Wall", description: "Post photos, videos and cheers.", recommended: true },
      { id: "chat", title: "Chat", description: "Chat with other fans.", recommended: true },
    ],
  },
];

// Lookup of every activation by id, for rendering from the order arrays.
export const ACTIVATION_BY_ID: Record<string, Activation> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.activations).map((a) => [a.id, a])
);

// Right-rail "Recommended for you" highlights.
export const RECOMMENDED_FOR_YOU: { id: string; title: string; subtitle: string }[] = [
  { id: "watch-game", title: "Watch Game", subtitle: "High fan engagement." },
  { id: "support-team", title: "Support a Team", subtitle: "Top revenue driver." },
  { id: "highlights-stats", title: "Highlights & Stats", subtitle: "Most popular feature." },
  { id: "fan-wall", title: "Fan Wall", subtitle: "Boosts community." },
];

// Maps each activation id to its backend feature-links payload key (camelCase).
export const FEATURE_LINK_KEY: Record<string, string> = {
  "buy-tickets": "buyTickets",
  "watch-game": "watchGame",
  "partner-offers": "partnerOffers",
  "highlights-stats": "highlightsStats",
  "support-team": "supportTeam",
  "shout-out-wall": "shoutOutWall",
  "team-stores": "teamStores",
  "record-game": "recordGame",
  "score-game": "scoreGame",
  predict: "predict",
  vote: "vote",
  arcade: "arcade",
  "challenges-quests": "challengesQuests",
  "fan-wall": "fanWall",
  chat: "chat",
};

// Maps each activation id to the school field the GET returns it under (for rehydrate).
// Most are `<key>Link`, but the backend remaps two: buy-tickets → `gofanSchoolPage`,
// watch-game → `nfhsNetworkLink` (verified against the live feature-links response).
export const SAVED_LINK_FIELD: Record<string, keyof SavedSchool> = {
  "buy-tickets": "gofanSchoolPage",
  "watch-game": "nfhsNetworkLink",
  "partner-offers": "partnerOffersLink",
  "highlights-stats": "highlightsStatsLink",
  "support-team": "supportTeamLink",
  "shout-out-wall": "shoutOutWallLink",
  "team-stores": "teamStoresLink",
  "record-game": "recordGameLink",
  "score-game": "scoreGameLink",
  predict: "predictLink",
  vote: "voteLink",
  arcade: "arcadeLink",
  "challenges-quests": "challengesQuestsLink",
  "fan-wall": "fanWallLink",
  chat: "chatLink",
};
