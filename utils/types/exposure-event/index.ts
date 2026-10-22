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

// GET /exposure/events now pages the events (?page=&limit=, newest first) and answers one envelope:
// the page's items, counts by status, the filter echoed back and the pagination.
export interface ExposureEventsResponse {
  data: {
    items: ExposureEvent[];
    summary: { all: number; upcoming: number; live: number; past: number };
    pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
  }[];
}

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
  officialScorekeeperFanId: string | null; // linked scorekeeper's fan id (null = unassigned)
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

// ─── Tournament Teams tree (GET /events/division-teams) ─────────────────────────
// A page of events, each with its divisions and their teams; counts are after the filters.

export interface TreeTeam {
  id: string;
  exposureTeamId: number;
  name: string;
  pool: string | null;
  grade: string | null;
  age: string | null;
  gender: string | null;
  // Synced roster size.
  playerCount: number;
  // Fans following the team in the app.
  followerCount: number;
}

export interface TreeDivision {
  id: string;
  exposureDivisionId: number;
  name: string;
  // Exposure's label; "unspecified" when Exposure sent none.
  gender: string | null;
  order: number | null;
  active: boolean;
  teamCount: number;
  teams: TreeTeam[];
}

export interface TreeEvent {
  id: string;
  exposureEventId: number;
  name: string;
  sport: string | null;
  city: string | null;
  state: string | null;
  startDate: string;
  endDate: string | null;
  divisionCount: number;
  teamCount: number;
  divisions: TreeDivision[];
  // Teams with no division; null when a divisionId filter is sent.
  unassigned: { teamCount: number; teams: TreeTeam[] } | null;
}

// Organisation-wide counts, the same whatever the filter (cached 5 min server-side).
export interface TournamentTotals {
  events: number;
  divisions: number;
  teams: number;
  games: number;
}

export interface DivisionTeamsTreeResponse {
  data: {
    totals: TournamentTotals;
    filter: { eventId: string | null; divisionId: string | null; search: string | null };
    events: TreeEvent[];
    pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
  }[];
}

// ─── Tournament schedule (GET /exposure/schedules) ──────────────────────────────

export interface TournamentScheduleSide {
  teamId: string | null;
  teamName: string | null;
  logoUrl: string | null;
}

export interface TournamentScheduleGame {
  id: string;
  title: string | null;
  start: string;
  // The real start instant (`start` is the venue's wall-clock time).
  utcTime: string | null;
  matchStatus: "pending" | "live" | "final" | string;
  result: string | null;
  location: string | null;
  home: TournamentScheduleSide;
  away: TournamentScheduleSide;
  event: { id: string; name: string } | null;
  division: { id: string; name: string } | null;
  finalScore: { home: number; away: number } | null;
  liveScore: { home: number; away: number } | null;
}

export interface TournamentScheduleResponse {
  data: {
    items: TournamentScheduleGame[];
    pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
  }[];
}
