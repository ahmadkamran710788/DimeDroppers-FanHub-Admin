"use client";

import { useEffect, useMemo, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";
import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import { useSelectedEvent } from "@/context/selected-event";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TournamentScheduleGame, TournamentScheduleResponse, TournamentScheduleSide } from "@/utils/types/exposure-event";
import type { ScheduleGamesResponse, ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";

const FALLBACK_LOGO = "/images/preview-crest.png";
// A game is taken as over this long after its start (the school list carries no live status).
const GAME_LENGTH_MS = 3 * 60 * 60 * 1000;
// The schedules API caps a page at 100.
const GAMES_LIMIT = 100;

const team = (name: string, logo: string | null | undefined): MediaTeam => ({ name, shortName: name, logo: logo || FALLBACK_LOGO });

// The score in a result: "56-30" is home-away; "W 56-30" / "L 7-37" put the school's score first.
const parseResult = (result: string | null, schoolIsAway: boolean) => {
  const m = result?.match(/^\s*([WLT])?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (!m) return null;
  const [a, b] = [Number(m[2]), Number(m[3])];
  if (!m[1]) return { home: a, away: b };
  return schoolIsAway ? { home: b, away: a } : { home: a, away: b };
};

// A school game from GET /schedules: the school on its home/away side, the opponent on the other, and
// the score from its result.
const toMediaGame = (g: ScheduleItem, school: MediaTeam, now: number): MediaGame => {
  const start = g.utcTime || g.start;
  const at = new Date(start).getTime();
  const opponent = team(g.opponent || "TBD", g.opponentLogoUrl);
  const away = g.homeAway === "away";
  const score = parseResult(g.result, away);
  // matchStatus when scorekeeping set it; otherwise guessed from the start time.
  const status =
    g.matchStatus === "final" || score
      ? "final"
      : g.matchStatus === "live"
        ? "live"
        : g.matchStatus === "pending"
          ? "upcoming"
          : at + GAME_LENGTH_MS < now
            ? "final"
            : at <= now
              ? "live"
              : "upcoming";
  return {
    fromApi: true,
    id: g.id,
    start,
    schoolSide: away ? "away" : "home",
    schoolTeamIds: away
      ? { home: g.opponentSchoolTeamId ?? null, away: g.teamId ?? null }
      : { home: g.teamId ?? null, away: g.opponentSchoolTeamId ?? null },
    home: away ? opponent : school,
    away: away ? school : opponent,
    status,
    homeScore: score?.home,
    awayScore: score?.away,
    thread: {},
  };
};

const toTournamentTeam = (side: TournamentScheduleSide): MediaTeam => {
  const name = side.teamName || "TBD";
  // Tournament teams have no logos: an initials avatar stands in.
  return { name, shortName: name, logo: "" };
};

const toTournamentGame = (g: TournamentScheduleGame): MediaGame => {
  const status = g.matchStatus === "final" || g.finalScore ? "final" : g.matchStatus === "live" || g.liveScore ? "live" : "upcoming";
  const score = status === "final" ? g.finalScore : status === "live" ? g.liveScore : null;
  return {
    fromApi: true,
    id: g.id,
    start: g.utcTime || g.start,
    teamIds: [g.home.teamId, g.away.teamId].filter((id): id is string => !!id),
    home: toTournamentTeam(g.home),
    away: toTournamentTeam(g.away),
    status,
    homeScore: score?.home,
    awayScore: score?.away,
    thread: {},
  };
};

// The organisation's games, for any page that lists them (Media, Add Recognition).
// - School: its own games (GET /schedules, with results and opponent logos), newest first.
// - Tournament: the games of the event picked in the shared event picker (GET /exposure/schedules?eventId=),
//   by start time.
// `games` is undefined for any other organisation kind (the page then shows its sample games).
// `teamNames`: a school game also carries its two teams' names (`teamNames`, from GET /schedules/games).
export function useOrgGames({ teamNames = false }: { teamNames?: boolean } = {}) {
  const { org } = useAuth();
  const orgKind = orgKindOf(org);
  const isSchool = orgKind === "school";
  const isTournament = orgKind === "tournament";
  const [schoolGames, setSchoolGames] = useState<MediaGame[] | null>(null);
  // Shared with every page's event picker.
  const { event, setEvent, noEvents } = useSelectedEvent();
  const [eventGames, setEventGames] = useState<{ eventId: string; games: MediaGame[] } | null>(null);
  const eventId = event?.id ?? "";

  const { savedSchool } = useSetup();
  const schoolName = savedSchool?.name || "My Team";
  const schoolLogo = savedSchool?.logoUrl;
  useEffect(() => {
    if (!isSchool) return;
    let cancelled = false;
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.listSchedules,
      method: "GET",
      data: { page: 1, limit: GAMES_LIMIT, sortOrder: "desc" },
    }).then((result) => {
      if (cancelled) return;
      const now = Date.now();
      const school = team(schoolName, schoolLogo);
      setSchoolGames(
        (result.success ? (result.data?.data?.[0]?.items ?? []) : [])
          // Games only (no practices).
          .filter((g) => g.activityType !== "PRACTICE")
          .map((g) => toMediaGame(g, school, now))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [isSchool, schoolName, schoolLogo]);

  // Team names of the school's games by schedule id, read from GET /schedules/games (GET /schedules has none).
  // A side without a teamName (often the opponent) keeps its school name.
  const [sideNames, setSideNames] = useState<Map<string, { home?: string; away?: string }> | null>(null);
  useEffect(() => {
    if (!isSchool || !teamNames) return;
    let cancelled = false;
    apiCall<ScheduleGamesResponse>({
      endpoint: routes.api.listScheduleGames,
      method: "GET",
      data: { page: 1, limit: GAMES_LIMIT, sortOrder: "desc" },
    }).then((result) => {
      if (cancelled) return;
      const rows = result.success ? (result.data?.data?.[0]?.schedules ?? []) : [];
      setSideNames(
        new Map(rows.map((r) => [r.id, { home: r.home?.teamName || undefined, away: r.away?.teamName || undefined }]))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [isSchool, teamNames]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiCall<TournamentScheduleResponse>({
      endpoint: routes.api.exposureSchedules,
      method: "GET",
      data: { eventId, page: 1, limit: GAMES_LIMIT },
    }).then((result) => {
      if (cancelled) return;
      const games = (result.success ? (result.data?.data?.[0]?.items ?? []) : []).map(toTournamentGame);
      setEventGames({ eventId, games: games.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()) });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const namedSchoolGames = useMemo(
    () =>
      (schoolGames ?? []).map((g) => {
        const names = sideNames?.get(g.id);
        return names ? { ...g, teamNames: names } : g;
      }),
    [schoolGames, sideNames]
  );

  const games = isSchool
    ? namedSchoolGames
    : isTournament
      ? eventGames?.eventId === eventId
        ? eventGames.games
        : []
      : undefined;
  const loading = isSchool ? schoolGames === null || (teamNames && sideNames === null) : isTournament && !noEvents && (!eventId || eventGames?.eventId !== eventId);

  return { games, loading, isTournament, event, setEvent, noEvents };
}
