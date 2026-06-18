export interface ScheduleItem {
  id: string;
  schoolId: string;
  title: string;
  opponent: string | null;
  opponentLogoUrl: string | null;
  description: string | null;
  location: string | null;
  start: string;
  end: string | null;
  isAllDay: boolean;
  homeAway: "home" | "away" | "neutral" | null;
  status: "confirmed" | "tentative" | "cancelled" | null;
  result: string | null;
  gender: string | null;
  season: string | null;
  sports: string | null;
  sourcePlatform: string;
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

export interface ScheduleItemResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: null | string;
  data: [ScheduleItem];
}
