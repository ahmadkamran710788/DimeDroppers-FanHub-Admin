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
import type { ScheduleGame, ScheduleGameSide, ScheduleGamesResponse } from "@/utils/types/schedule";

const CONTENT_TABS = ["Game Thread", "Game Details"] as const;
const FALLBACK_LOGO = "/images/preview-crest.png";
// A game is taken as over this long after its start (the school list carries no live status).
const GAME_LENGTH_MS = 3 * 60 * 60 * 1000;
// The schedules API caps a page at 100.
const GAMES_LIMIT = 100;

const toTeam = (side: ScheduleGameSide | null): MediaTeam => {
  const name = side?.name || "TBD";
  return { name, shortName: name, logo: FALLBACK_LOGO };
};

const toMediaGame = (g: ScheduleGame, now: number): MediaGame => {
  const start = g.utcTime || g.start;
  const at = new Date(start).getTime();
  return {
    fromApi: true,
    id: g.id,
    start,
    home: toTeam(g.home),
    away: toTeam(g.away),
    status: at + GAME_LENGTH_MS < now ? "final" : at <= now ? "live" : "upcoming",
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
// - School: its own games (GET /schedules/games); each game's content from the game-detail endpoints.
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

  useEffect(() => {
    if (!isSchool) return;
    let cancelled = false;
    apiCall<ScheduleGamesResponse>({
      endpoint: routes.api.listScheduleGames,
      method: "GET",
      data: { page: 1, limit: GAMES_LIMIT, sortOrder: "desc" },
    }).then((result) => {
      if (cancelled) return;
      const now = Date.now();
      setSchoolGames((result.success ? (result.data?.data?.[0]?.schedules ?? []) : []).map((g) => toMediaGame(g, now)));
    });
    return () => {
      cancelled = true;
    };
  }, [isSchool]);

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
