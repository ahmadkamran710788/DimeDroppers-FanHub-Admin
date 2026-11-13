// GET /fanhub/org/game-detail/games/{scheduleEventId}/recap | insights | thread (school games).

export interface GameDetailTeamSide {
  Team: string | null;
  School: string | null;
  Logo: string | null;
  // The doc names it `Points`; the API sends `Score`.
  Score: number | null;
  Record?: string | null;
}

export interface GameDetailHeader {
  id: string;
  title: string;
  sports: string | null;
  start: string | null;
  utcTime: string | null;
  status: string;
  result: string | null;
}

interface GameDetailBase {
  game: GameDetailHeader;
  Home: GameDetailTeamSide;
  Away: GameDetailTeamSide;
}

export interface GameRecapDetail extends GameDetailBase {
  recap: { headline: string; paragraphs: string[]; generatedAt: string } | null;
}

export interface InsightBullet {
  label: string;
  text: string;
}

export interface InsightScope {
  points: number;
  strengths: string[];
  areasForImprovement: string[];
  // Only when the insights were written by the AI (source "claude").
  strengthItems?: InsightBullet[];
  areasForImprovementItems?: InsightBullet[];
}

export interface InsightTeamCard {
  teamSide: "HOME" | "AWAY";
  teamName: string;
  points: number;
  season: string | null;
  location: string | null;
  playerCount: number | null;
  scopes: { all: InsightScope; h1: InsightScope; h2: InsightScope } & Record<string, InsightScope>;
}

export interface GameInsightsDetail extends GameDetailBase {
  insights: {
    source: "claude" | "rules";
    gameDefiningTrend: string | null;
    generatedAt: string;
    teams: InsightTeamCard[];
  } | null;
}

export type ThreadPhase = "pre" | "live" | "final";

export interface ThreadPeriod {
  period: number;
  key: string;
  label: string;
  startsAt: string;
}

export interface ThreadItem {
  id: string;
  kind: "phase" | "play" | "highlight" | "prediction" | "poll" | "sponsorOffer" | "challenge" | "donation";
  subKind: string;
  at: string;
  phase: ThreadPhase;
  periodKey: string;
  periodLabel: string;
  title: string;
  body: string | null;
  data: { teamSide?: "HOME" | "AWAY"; score?: string | null; clock?: string | null } & Record<string, unknown>;
}

export interface GameThreadDetail extends GameDetailBase {
  presentedBy: { name: string } | null;
  // The phase asked for; null when the whole thread (every phase) came back.
  phase: ThreadPhase | null;
  currentPhase: ThreadPhase;
  boundaries: { periodFormat: "QUARTERS" | "HALVES"; currentPeriod: number | null; periods: ThreadPeriod[] };
  // Item counts per phase after `search` (for badges).
  phaseCounts?: Record<ThreadPhase, number>;
  // In feed order.
  sections: { key: string; label: string; phase?: ThreadPhase; count: number }[];
  items: ThreadItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
