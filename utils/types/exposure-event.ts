export interface ExposureEvent {
  id: string; // FanHubSchoolEvent id — row key & the :id for all sub-resource routes
  schoolId: string;
  exposureEventId: number; // numeric Exposure id — NOT used as the :id
  crmLeadId: string | null;
  crmEventId: string | null;
  name: string;
  sport: string | null;
  eventType: string | null;
  city: string | null;
  state: string | null;
  startDate: string; // ISO
  endDate: string | null; // ISO
  link: string | null;
  createdAt: string;
  updatedAt: string;
  gameCount: number;
  teamCount: number;
  divisionCount: number;
}

// Which detail view the per-event modal is showing.
export type ExposureEventView = "brackets" | "games" | "teams" | "standings" | "venues";

// Generic envelope shared by every Exposure list endpoint.
export interface ExposureListResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: string | null;
  data: T[];
}

export type ExposureEventsResponse = ExposureListResponse<ExposureEvent>;

// ─── Brackets (GET /events/:id/divisions — divisions with nested brackets) ──────

export interface ExposureBracket {
  id: string;
  schoolId: string;
  fanHubSchoolEventId: string;
  fanHubDivisionId: string;
  exposureBracketId: number;
  name: string;
  url: string | null;
  results: { Name: string; Images: unknown[] }[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExposureDivision {
  id: string;
  schoolId: string;
  fanHubSchoolEventId: string;
  exposureDivisionId: number;
  name: string;
  gender: number | null;
  order: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  brackets: ExposureBracket[];
}

// ─── Game schedule (GET /events/:id/games) ──────────────────────────────────────

export interface ExposureGame {
  id: string;
  schoolId: string;
  fanHubSchoolEventId: string;
  externalId: string | null;
  title: string | null;
  opponent: string | null;
  location: string | null;
  start: string;
  end: string | null;
  isAllDay: boolean;
  status: string | null;
  homeAway: string | null;
  result: string | null;
  sports: string | null;
  sourcePlatform: string | null;
  sourceUrl: string | null;
}

// ─── Teams (GET /events/:id/teams) ──────────────────────────────────────────────

export interface ExposureTeam {
  id: string;
  exposureTeamId: number;
  name: string;
  pool: string | null;
  parentTeamId: string | null;
  fanHubSchoolEventId: string;
  schoolId: string;
  gender: number | null;
  grade: string | null;
  age: string | null;
  divisionName: string | null;
  fanHubDivisionId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { players: number } | null;
}

// ─── Standings (GET /events/:id/standings?display=Pool|Bracket) ─────────────────
// `columns` is a dynamic stat map (e.g. { W, L, PF, PA }) — keys vary per event.

export interface ExposureStanding {
  id: string;
  schoolId: string;
  fanHubSchoolEventId: string;
  display: string;
  groupName: string | null;
  exposureGroupId: number | null;
  poolName: string | null;
  exposurePoolId: number | null;
  teamName: string | null;
  exposureTeamId: number | null;
  participantId: number | null;
  place: string | null;
  columns: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Venues (GET /events/:id/venues) ────────────────────────────────────────────

export interface ExposureVenueCourt {
  Id: number;
  Sport: number;
  Name: string;
  Abbr: string;
}

export interface ExposureVenue {
  id: string;
  schoolId: string;
  fanHubSchoolEventId: string;
  exposureVenueId: number;
  name: string;
  abbr: string | null;
  location: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  courts: ExposureVenueCourt[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Players (GET /teams/:teamId/players — note: under exposure/teams, not events) ──

export interface ExposurePlayer {
  id: string;
  schoolId: string;
  fanHubTeamId: string;
  exposurePlayerId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  grade: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  playerSchool: string | null;
  college: string | null;
  graduationYear: string | null;
  createdAt: string;
  updatedAt: string;
}
