// Recognitions and their templates: /fanhub/org/recognitions and /fanhub/org/recognition-wall-templates
// (FANHUB_ORG_RECOGNITIONS_FRONTEND.md, FANHUB_RECOGNITION_TEMPLATES_AND_RULES.md).

export type RecognitionCategory = "PLAYER";
export type RecognitionTemplateKey = "PLAYER_GAME" | "PLAYER_PROFILE";
export type RecognitionStatus = "DRAFT" | "PUBLISHED";
export type AwardBadge =
  | "HUSTLE"
  | "TEAMWORK"
  | "CHARACTER"
  | "FAN_LOVE"
  | "GAME_CHANGER"
  | "PLAYER_OF_THE_GAME"
  | "ATHLETE_OF_THE_MONTH"
  | "RISING_STAR"
  | "LEADERSHIP"
  | "THANK_YOU";

// How a person is referred to: the Recognized By person (TEAM_ROLE / ROSTER_STAFF / ROSTER_PARENT) or
// the player (FANHUB_PLAYER = a fan holding the PLAYER role, ROSTER_PLAYER = a school roster player,
// TOURNAMENT_PLAYER = a tournament roster row, FanHubPlayer id). A tournament only uses TEAM_ROLE givers.
export type RecognitionRefType =
  | "TEAM_ROLE"
  | "ROSTER_STAFF"
  | "ROSTER_PARENT"
  | "FANHUB_PLAYER"
  | "ROSTER_PLAYER"
  | "TOURNAMENT_PLAYER";

export interface RecognitionRef {
  type: RecognitionRefType;
  id: string;
}

// One template: its layout (blocks top to bottom) and which fields a recognition must / must not send.
export interface RecognitionWallTemplate {
  id: string;
  category: RecognitionCategory;
  template: RecognitionTemplateKey;
  templateJson: { cardOrder: string[]; required: string[]; notAllowed: string[] };
  createdAt: string;
}

// The body of POST (create) and PATCH (a full replace). `eventId` is required for a tournament, never sent by a school.
export interface RecognitionBody {
  eventId?: string;
  category: RecognitionCategory;
  template: RecognitionTemplateKey;
  status: RecognitionStatus;
  awardBadge: AwardBadge;
  description: string;
  recognizedBy: RecognitionRef;
  player: RecognitionRef;
  scheduleEventId?: string;
  // The card colour, #RRGGBB (required).
  hexColor: string;
  // ATHLETE_OF_THE_MONTH only: the month it's for, "YYYY-MM".
  period?: string;
}

// A recognition as the API returns it, with the card data filled in from the ids.
export interface Recognition {
  // The tournament event; null for a school.
  eventId?: string | null;
  id: string;
  category: RecognitionCategory;
  template: RecognitionTemplateKey;
  status: RecognitionStatus;
  awardBadge: AwardBadge;
  description: string;
  createdAt: string;
  recognizedBy: RecognitionRef & { name: string; role: string };
  player: RecognitionRef & {
    name: string;
    jerseyNumber: string | null;
    position: string | null;
    grade: string | null;
    teamName: string | null;
    // The player's linked Fan Hub account (presigned avatar URL); null without one.
    fan?: { name: string | null; profileUrl: string | null } | null;
  };
  scheduleEventId: string | null;
  // ATHLETE_OF_THE_MONTH: the month it's for, "YYYY-MM".
  period?: string | null;
  // The card colour (#RRGGBB); missing / null on older rows = the template's.
  hexColor?: string | null;
  // The resolved team, and its sport and school.
  teamId?: string | null;
  sport?: string | null;
  schoolName?: string | null;
  game: {
    startUtc: string;
    home: { name: string; logoUrl: string | null };
    away: { name: string; logoUrl: string | null };
  } | null;
}

export interface Paged<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
}
