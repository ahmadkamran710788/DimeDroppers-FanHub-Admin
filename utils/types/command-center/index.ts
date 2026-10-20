// GET /fanhub/org/command-center/overview: the five stat cards and Event Readiness.
export interface CommandCenterOverview {
  // `kind` / `level` say whether it is a school or a tournament (e.g. "TOURNAMENT" / "Tournament").
  organisation: { id: string; name: string; kind: string; level: string | null; logoUrl: string | null };
  generatedAt: string;
  cards: {
    teams: { total: number; addedLast12Months: number; divisions?: number | null };
    // `live` / `startingSoon` feed the event hero.
    games: { total: number; today: number; live?: number | null; startingSoon?: number | null };
    liveViewers: { now: number; liveGames: number };
    tickets: { sold: number; soldLast30Days: number; grossUsd: number };
    // `changeLast30DaysPercent` is null when there is nothing to compare against.
    followers: { total: number; addedLast30Days: number; changeLast30DaysPercent: number | null; schoolFollowers: number };
  };
  readiness: {
    // Share of the next 7 days' games that have an official scorekeeper (100 when none is coming).
    percent: number;
    upcomingGames: number;
    upcomingGamesWithScorekeeper: number;
    pendingScorekeeperRequests: number;
    pendingVideographerRequests: number;
    pendingMessageRequests: number;
    activeDonations: number;
  };
}

export interface LiveGameSide {
  id: string | null;
  name: string | null;
  logoUrl: string | null;
}

// The scorekeeper's live state; the clock fields are null when the game was never started in the app.
export interface LiveGameState {
  homePoints: number;
  awayPoints: number;
  currentPeriod: number | null;
  periodFormat: string | null;
  gameClockSeconds: number | null;
  isTimerRunning: boolean | null;
  startedAt: string | null;
  endedAt: string | null;
  viewers: number;
}

// A row of GET /fanhub/org/command-center/live-games.
export interface LiveGame {
  id: string;
  title: string;
  // Local wall-clock time with a "Z"; `utcTime` is the real instant.
  start: string;
  utcTime?: string | null;
  isAllDay: boolean;
  matchStatus: string | null;
  home: LiveGameSide | null;
  away: LiveGameSide | null;
  live: LiveGameState;
}

export interface LiveGamesPage {
  count: number;
  total: number;
  games: LiveGame[];
}

export interface RecapSide {
  School: string | null;
  Score: number | null;
  Logo: string | null;
}

export interface RecapLeader {
  playerName: string;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
}

// GET /fanhub/org/command-center/games/{id}/recap.
export interface GameRecapData {
  game: { id: string; title: string; status: string | null };
  Home: RecapSide;
  Away: RecapSide;
  recap: { headline: string; paragraphs: string[]; generatedAt: string };
  details: {
    // UTC instant, else the local start string.
    date: string;
    venue: string | null;
    homeAway: string | null;
    // live / final / pending
    matchStatus: string;
    score: { home: number; away: number };
    startedAt: string | null;
    endedAt: string | null;
  };
  // null for a side with no scoring player.
  leaders: { home: RecapLeader | null; away: RecapLeader | null };
}
