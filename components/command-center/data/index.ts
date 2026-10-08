import type { Stat } from "@/components/common/stat-card";
import type { ScheduleItem } from "@/utils/types/schedule";

export interface ReadinessItem {
  label: string;
  // "done" shows a tick; otherwise a "22 / 24" count or a number of exceptions.
  value: string;
  tone?: "done" | "warning";
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

// TEMPORARY: two live games so the Live Games cards can be previewed. Remove once real games go live.
const PREVIEW_START = new Date(Date.now() - 30 * 60 * 1000).toISOString();
export const PREVIEW_LIVE_GAMES: ScheduleItem[] = [
  { opponent: "Riverside Middle School", id: "preview-live-1" },
  { opponent: "Landmark Middle School", id: "preview-live-2" },
].map(({ id, opponent }) => ({
  id,
  schoolId: "preview",
  title: `vs ${opponent}`,
  opponent,
  opponentLogoUrl: null,
  description: null,
  location: null,
  start: PREVIEW_START,
  end: null,
  isAllDay: false,
  homeAway: "home",
  status: "confirmed",
  result: null,
  gender: null,
  season: null,
  sports: null,
  level: null,
  sourcePlatform: "preview",
  createdAt: PREVIEW_START,
  updatedAt: PREVIEW_START,
}));

// TEMPORARY: demo scores for the preview games (home first).
export const PREVIEW_SCORES: Record<string, [number, number]> = {
  "preview-live-1": [28, 24],
  "preview-live-2": [56, 30],
};
