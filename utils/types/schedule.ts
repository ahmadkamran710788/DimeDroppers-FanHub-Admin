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

export interface ScheduleListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: null | string;
  data: [{ items: ScheduleItem[]; pagination: SchedulePagination }];
}

export interface ScheduleItemResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: null | string;
  data: [ScheduleItem];
}
