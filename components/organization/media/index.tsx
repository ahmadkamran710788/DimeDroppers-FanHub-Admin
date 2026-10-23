"use client";

import { useEffect, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";
import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import EventSelect from "@/components/organization/event-select";
import GameDetails from "@/components/organization/media/game-details";
import GamesBrowser from "@/components/organization/media/games-browser";
import GameThread from "@/components/organization/media/game-thread";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TournamentScheduleGame, TournamentScheduleResponse, TournamentScheduleSide } from "@/utils/types/exposure-event";
import { useSetup } from "@/context/setup";
import type { ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";

const CONTENT_TABS = ["Game Thread", "Game Details"] as const;
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
    tournament: true,
    id: g.id,
    start: g.utcTime || g.start,
    home: toTournamentTeam(g.home),
    away: toTournamentTeam(g.away),
    status,
    homeScore: score?.home,
    awayScore: score?.away,
    thread: {},
  };
};

// Media: pick a game on the left, see its score, play-by-play thread and recap on the right.
// - School: its own games (GET /schedules, with results and opponent logos); each game's content from the game-detail endpoints.
// - Tournament: an event is picked at the top (the newest first), then its games (GET
//   /exposure/schedules?eventId=). Their thread and details have no API yet.
export default function MediaPage() {
  const { org } = useAuth();
  const orgKind = orgKindOf(org);
  const isSchool = orgKind === "school";
  const isTournament = orgKind === "tournament";
  const [schoolGames, setSchoolGames] = useState<MediaGame[] | null>(null);
  const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
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

  const games = isSchool
    ? (schoolGames ?? [])
    : isTournament
      ? eventGames?.eventId === eventId
        ? eventGames.games
        : []
      : undefined;
  const loading = isSchool ? schoolGames === null : isTournament && (!eventId || eventGames?.eventId !== eventId);

  return (
    <GamesBrowser
      title="Media"
      description="View media, highlights and game content for your games."
      tabs={CONTENT_TABS}
      games={games}
      loading={loading}
      headerAction={
        isTournament && (
          <EventSelect
            value={eventId}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
        )
      }
      renderContent={(tab, game) =>
        game.tournament ? (
          <p className="py-10 text-center text-sm text-white/50">
            {tab === "Game Thread" ? "The game thread" : "Game details"} for tournament games will be available soon.
          </p>
        ) : tab === "Game Thread" ? (
          <GameThread game={game} />
        ) : (
          <GameDetails game={game} />
        )
      }
    />
  );
}
