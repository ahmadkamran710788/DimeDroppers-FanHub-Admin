// SAMPLE DATA — there is no media/game-content endpoint yet. Mirrors the Media mockups
// (games list, Game Thread and Game Details); replace with API calls once the backend exists.

import { SAMPLE_GAME, type Highlight, type ShopProduct } from "@/components/schedule/game-center/data";

export interface MediaTeam {
  name: string;
  // Shorter name for the games list, e.g. "Twin Lakes Academy".
  shortName: string;
  logo: string;
}

export type GameStatus = "final" | "live" | "upcoming";
export type GamePhase = "Pre-Game" | "Live Game" | "Final";
export type Quarter = "1st Quarter" | "2nd Quarter" | "3rd Quarter" | "4th Quarter";

export interface PlayEvent {
  id: string;
  time: string;
  // Small label above the text, e.g. "2PT Made", "Quarter".
  type: string;
  text: string;
  // Team logo for scoring plays; a clock icon is shown when omitted.
  teamLogo?: string;
  // Running score after the play, e.g. "2 - 0".
  score?: string;
}

export interface MediaGame {
  id: string;
  // ISO date-time.
  start: string;
  home: MediaTeam;
  away: MediaTeam;
  status: GameStatus;
  homeScore?: number;
  awayScore?: number;
  // Plays per phase and quarter (Pre-Game / Final only use "1st Quarter").
  thread: Partial<Record<GamePhase, Partial<Record<Quarter, PlayEvent[]>>>>;
  recap?: { headline: string; paragraphs: string[] };
  // Highlight clips for the Videos section.
  videos?: Highlight[];
  // Merch for the Shop Items section.
  shop?: ShopProduct[];
}

const TEAMS = {
  twinLakes: {
    name: "Twin Lakes Academy Middle School",
    shortName: "Twin Lakes Academy",
    logo: "/images/media/twin-lakes.png",
  },
  landmark: { name: "Landmark Middle School", shortName: "Landmark Middle School", logo: "/images/media/landmark.png" },
  riverside: { name: "Riverside Middle School", shortName: "Riverside Middle School", logo: "/images/media/riverside.png" },
  jacksonville: {
    name: "Jacksonville Middle School",
    shortName: "Jacksonville Middle School",
    logo: "/images/media/jacksonville.png",
  },
  mayport: { name: "Mayport Middle School", shortName: "Mayport Middle School", logo: "/images/media/mayport.png" },
  southside: { name: "Southside Middle School", shortName: "Southside Middle School", logo: "/images/media/southside.png" },
} satisfies Record<string, MediaTeam>;

const LANDMARK_FIRST_QUARTER: PlayEvent[] = [
  {
    id: "e-1",
    time: "12:00 AM",
    type: "Game Update",
    text: "TWIN LAKES ACADEMY MIDDLE SCHOOL Boys Basketball Team vs LANDMARK MIDDLE SCHOOL Boys Basketball Team is underway.",
  },
  { id: "e-2", time: "12:00 AM", type: "Quarter", text: "1st Quarter begins" },
  {
    id: "e-3",
    time: "12:18 AM",
    type: "2PT Made",
    text: "King Williams (AST: Ava Johnson)",
    teamLogo: TEAMS.twinLakes.logo,
    score: "2 - 0",
  },
  {
    id: "e-4",
    time: "11:45 AM",
    type: "2PT Made",
    text: "Cayden Richardson (AST: Sofia Martinez)",
    teamLogo: TEAMS.landmark.logo,
    score: "2 - 2",
  },
  {
    id: "e-5",
    time: "10:32 AM",
    type: "3PT Made",
    text: "Jaren Dunnamon (AST: King Williams)",
    teamLogo: TEAMS.twinLakes.logo,
    score: "5 - 2",
  },
];

export const SAMPLE_GAMES: MediaGame[] = [
  {
    id: "game-1",
    start: "2026-09-03T18:00:00",
    home: TEAMS.twinLakes,
    away: TEAMS.landmark,
    status: "final",
    homeScore: 56,
    awayScore: 30,
    thread: { "Live Game": { "1st Quarter": LANDMARK_FIRST_QUARTER } },
    videos: SAMPLE_GAME.highlights,
    shop: SAMPLE_GAME.shop,
    recap: {
      headline: "Mount Powers Twin Lakes Past Landmark in 56-30 Rout",
      paragraphs: [
        "Twin Lakes Academy Middle School never trailed in a dominant 56-30 victory over Landmark Middle School in Jacksonville, racing to double digits early and controlling every quarter of the boys' matchup.",
        "The hosts set the tone from the opening tip, opening on a 9-0 surge and holding a 14-4 edge after the first quarter. Jonathan Mount anchored the effort with 16 points, eight rebounds and four blocks, repeatedly cleaning up on the glass and finishing his own misses inside.",
        "Twin Lakes was ruthlessly efficient, converting at an 85.7 percent clip from the field and making all four of its three-point attempts. Jaren Dunnamon supplied each of those triples for 12 points, while King Williams added 10 points and dished out five assists to keep the offense flowing.",
      ],
    },
  },
  {
    id: "game-2",
    start: "2026-09-05T18:00:00",
    home: TEAMS.twinLakes,
    away: TEAMS.riverside,
    status: "live",
    homeScore: 28,
    awayScore: 24,
    thread: {},
  },
  { id: "game-3", start: "2026-09-10T22:00:00", home: TEAMS.twinLakes, away: TEAMS.jacksonville, status: "upcoming", thread: {} },
  { id: "game-4", start: "2026-09-15T19:00:00", home: TEAMS.twinLakes, away: TEAMS.mayport, status: "upcoming", thread: {} },
  { id: "game-5", start: "2026-09-20T18:00:00", home: TEAMS.twinLakes, away: TEAMS.southside, status: "upcoming", thread: {} },
];
