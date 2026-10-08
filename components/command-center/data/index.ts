import type { Stat } from "@/components/common/stat-card";

export type GameStatus = "Live" | "Halftime" | "Final";

export interface ReadinessItem {
  label: string;
  // "done" shows a tick; otherwise a "22 / 24" count or a number of exceptions.
  value: string;
  tone?: "done" | "warning";
}

export interface LiveGame {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
  // Division and game clock, e.g. "17U Gold · Q3 04:22".
  detail: string;
  court: string;
  // 0–100, how much of the game has been played.
  progress: number;
}

// Sample tournament until the tournament operations API exists.
export const EVENT = {
  name: "Balling on the Beach",
  liveGames: 8,
  teams: 650,
  divisions: 14,
  readiness: 94,
};

export const READINESS: ReadinessItem[] = [
  { label: "Pending Scorekeeper Requests", value: "3", tone: "warning" },
  { label: "Pending Videographer Requests", value: "2", tone: "warning" },
  { label: "Pending Message Requests", value: "5", tone: "warning" },
  { label: "Active Donations", value: "6" },
];

export const COMMAND_STATS: Stat[] = [
  { label: "Teams", value: "650", tint: "rgba(101,193,98,0.5)", trend: "up", caption: "+32 vs prior year" },
  { label: "Games", value: "1,284", tint: "rgba(99,139,254,0.5)", caption: "236 today" },
  { label: "Live Viewers", value: "4,862", tint: "rgba(157,98,193,0.5)", change: 18.4, caption: "today" },
  { label: "Tickets Sold", value: "12,438", tint: "rgba(184,184,184,0.5)", caption: "$247K gross" },
  { label: "Total Followers", value: "8,940", tint: "rgba(184,184,184,0.5)", change: 12.6, caption: "vs Last 30 Days" },
];

export const LIVE_GAMES: LiveGame[] = [
  { id: "g1", home: "Twin Lakes", away: "Landmark", homeScore: 54, awayScore: 48, status: "Live", detail: "17U Gold · Q3 04:22", court: "Court 1", progress: 65 },
  { id: "g2", home: "Southside", away: "Alfred I. duPont", homeScore: 61, awayScore: 63, status: "Live", detail: "16U Silver · Q4 01:08", court: "Court 2", progress: 88 },
  { id: "g3", home: "Landon", away: "Darnell-Cookman", homeScore: 31, awayScore: 27, status: "Halftime", detail: "15U Gold · Half", court: "Court 3", progress: 50 },
  { id: "g4", home: "Lake Country", away: "Big House", homeScore: 22, awayScore: 25, status: "Live", detail: "17U Gold · Q2 06:15", court: "Court 4", progress: 35 },
];

export const GAME_STATUS_COLOR: Record<GameStatus, string> = {
  Live: "bg-success",
  Halftime: "bg-[#FF8D2A]",
  Final: "bg-white/30",
};
