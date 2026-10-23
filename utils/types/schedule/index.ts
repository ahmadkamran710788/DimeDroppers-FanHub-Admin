export interface ScheduleItem {
  id: string;
  schoolId: string;
  title: string;
  opponent: string | null;
  opponentLogoUrl: string | null;
  description: string | null;
  location: string | null;
  // The event's local wall-clock time written with a "Z" (not a real UTC instant); compare times with utcTime.
  start: string;
  // The real UTC start; missing on older rows.
  utcTime?: string | null;
  end: string | null;
  isAllDay: boolean;
  homeAway: "home" | "away" | "neutral" | null;
  status: "confirmed" | "tentative" | "cancelled" | null;
  result: string | null;
  // The game's live state from scorekeeping.
  matchStatus?: "pending" | "live" | "final" | null;
  gender: string | null;
  season: string | null;
  sports: string | null;
  level: string | null;
  sourcePlatform: string;
  // GAME or PRACTICE; null when the event has no type (treated like a game).
  activityType?: "GAME" | "PRACTICE" | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isLast: boolean;
}

export interface ScheduleSummary {
  totalGames: number;
  homeGames: number;
  awayGames: number;
  neutralGames: number;
  events: number;
  completed: number;
  homePercent: number;
  awayPercent: number;
  neutralPercent: number;
  eventsPercent: number;
}

export interface ScheduleListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: null | string;
  data: [{ items: ScheduleItem[]; pagination: SchedulePagination; summary: ScheduleSummary }];
}

// One side of a GET /schedules/games row.
export interface ScheduleGameSide {
  id: string | null;
  name: string | null;
}

// A row of GET /fanhub/org/schedules/games (games only).
export interface ScheduleGame {
  id: string;
  title: string;
  start: string;
  utcTime?: string | null;
  sports: string | null;
  level: string | null;
  activityType: string;
  home: ScheduleGameSide | null;
  away: ScheduleGameSide | null;
}

export interface ScheduleGamesResponse {
  data: [{ school: { id: string }; schedules: ScheduleGame[]; pagination: SchedulePagination }];
}

export interface ScheduleItemResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: null | string;
  data: [ScheduleItem];
}
