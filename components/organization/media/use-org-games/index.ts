"use client";

import { FALLBACK_CREST } from "@/utils/constants/fallback-crest";
import { useEffect, useMemo, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";
import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import { useSelectedEvent } from "@/context/selected-event";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TournamentScheduleGame, TournamentScheduleResponse, TournamentScheduleSide } from "@/utils/types/exposure-event";
import type { ScheduleGamesResponse, ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";

// A game is taken as over this long after its start (the school list carries no live status).
const GAME_LENGTH_MS = 3 * 60 * 60 * 1000;
// The schedules API caps a page at 100.
const GAMES_LIMIT = 100;

// The pages of one list read so far (`key` says which list), and whether the API has more.
interface Paged {
  key: string;
  pages: MediaGame[][];
  isLast: boolean;
}

// Adds the next page to a list, or starts it over when the list changed.
const addPage = (prev: Paged | null, key: string, games: MediaGame[], isLast: boolean): Paged => ({
  key,
  pages: [...(prev?.key === key ? prev.pages : []), games],
  isLast,
});

const team = (name: string, logo: string | null | undefined): MediaTeam => ({ name, shortName: name, logo: logo || FALLBACK_CREST });

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
    sport: g.sports ?? undefined,
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

// A team without a logo shows the organisation's logo (or, without one, an initials avatar).
const toTournamentTeam = (side: TournamentScheduleSide, orgLogo: string): MediaTeam => {
  const name = side.teamName || "TBD";
  return { name, shortName: name, logo: side.logoUrl || orgLogo };
};

const toTournamentGame = (g: TournamentScheduleGame, orgLogo: string): MediaGame => {
  const status = g.matchStatus === "final" || g.finalScore ? "final" : g.matchStatus === "live" || g.liveScore ? "live" : "upcoming";
  const score = status === "final" ? g.finalScore : status === "live" ? g.liveScore : null;
  return {
    fromApi: true,
    id: g.id,
    start: g.utcTime || g.start,
    teamIds: [g.home.teamId, g.away.teamId].filter((id): id is string => !!id),
    home: toTournamentTeam(g.home, orgLogo),
    away: toTournamentTeam(g.away, orgLogo),
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
// `pageSize`: read the games that many at a time; `loadMore` asks for the next page while `hasMore`. Without
// it, one page of up to 100 games is read.
export function useOrgGames({ teamNames = false, pageSize = GAMES_LIMIT }: { teamNames?: boolean; pageSize?: number } = {}) {
  const { org, isLoading: authLoading } = useAuth();
  const orgKind = orgKindOf(org);
  const isSchool = orgKind === "school";
  const isTournament = orgKind === "tournament";
  // Shared with every page's event picker.
  const { event, setEvent, noEvents } = useSelectedEvent();
  const eventId = event?.id ?? "";

  // The school's name and logo go on its games, so they're read first (no "My Team" before the real name).
  const { savedSchool, isLoading: schoolLoading } = useSetup();
  const schoolName = savedSchool?.name || "My Team";
  const schoolLogo = savedSchool?.logoUrl;

  // The pages read so far for one list (the school's, or one event's), and how many pages are wanted.
  const schoolKey = `school:${schoolName}:${schoolLogo ?? ""}`;
  const eventKey = `event:${eventId}:${schoolLogo ?? ""}`;
  const listKey = isSchool ? schoolKey : eventKey;
  const [schoolPages, setSchoolPages] = useState<Paged | null>(null);
  const [eventPages, setEventPages] = useState<Paged | null>(null);
  const [wanted, setWanted] = useState({ key: "", pages: 1 });
  const wantedPages = wanted.key === listKey ? wanted.pages : 1;
  const schoolHave = schoolPages?.key === schoolKey ? schoolPages.pages.length : 0;
  const eventHave = eventPages?.key === eventKey ? eventPages.pages.length : 0;

  useEffect(() => {
    if (!isSchool || schoolLoading || schoolHave >= wantedPages) return;
    let cancelled = false;
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.listSchedules,
      method: "GET",
      data: { page: schoolHave + 1, limit: pageSize, sortOrder: "desc" },
    }).then((result) => {
      if (cancelled) return;
      const now = Date.now();
      const school = team(schoolName, schoolLogo);
      const body = result.success ? result.data?.data?.[0] : undefined;
      const games = (body?.items ?? [])
        // Games only (no practices).
        .filter((g) => g.activityType !== "PRACTICE")
        .map((g) => toMediaGame(g, school, now));
      setSchoolPages((prev) => addPage(prev, schoolKey, games, body?.pagination.isLast ?? true));
    });
    return () => {
      cancelled = true;
    };
  }, [isSchool, schoolLoading, schoolKey, schoolName, schoolLogo, schoolHave, wantedPages, pageSize]);

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
    if (!eventId || schoolLoading || eventHave >= wantedPages) return;
    let cancelled = false;
    apiCall<TournamentScheduleResponse>({
      endpoint: routes.api.exposureSchedules,
      method: "GET",
      data: { eventId, page: eventHave + 1, limit: pageSize },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      const games = (body?.items ?? []).map((g) => toTournamentGame(g, schoolLogo || ""));
      setEventPages((prev) => addPage(prev, eventKey, games, body?.pagination.isLast ?? true));
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, schoolLoading, eventKey, schoolLogo, eventHave, wantedPages, pageSize]);

  const schoolGames = useMemo(
    () => (schoolPages?.key === schoolKey ? schoolPages.pages.flat() : null),
    [schoolPages, schoolKey]
  );
  const eventGames = useMemo(
    () =>
      eventPages?.key === eventKey
        ? eventPages.pages.flat().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        : null,
    [eventPages, eventKey]
  );

  const namedSchoolGames = useMemo(
    () =>
      (schoolGames ?? []).map((g) => {
        const names = sideNames?.get(g.id);
        return names ? { ...g, teamNames: names } : g;
      }),
    [schoolGames, sideNames]
  );

  const games = isSchool ? namedSchoolGames : isTournament ? (eventGames ?? []) : undefined;
  // Loading too while the sign-in is still read (the organisation's kind isn't known yet), so no page shows
  // anything before its own games.
  const loading = isSchool
    ? schoolGames === null || (teamNames && sideNames === null)
    : isTournament
      ? !noEvents && (!eventId || eventGames === null)
      : authLoading;

  const current = isSchool ? (schoolPages?.key === schoolKey ? schoolPages : null) : eventPages?.key === eventKey ? eventPages : null;
  const hasMore = !!current && !current.isLast;
  const loadingMore = !!current && current.pages.length < wantedPages;
  const loadMore = () => setWanted({ key: listKey, pages: (current?.pages.length ?? 0) + 1 });

  return { games, loading, isTournament, event, setEvent, noEvents, hasMore, loadingMore, loadMore };
}
