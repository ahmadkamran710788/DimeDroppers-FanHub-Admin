"use client";

import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameDetailTeamSide, GameThreadDetail } from "@/utils/types/game-detail";

const FALLBACK_LOGO = "/images/preview-crest.png";

const withSide = (team: MediaTeam, side: GameDetailTeamSide): MediaTeam => ({
  ...team,
  name: side.Team || team.name,
  logo: team.logo && team.logo !== FALLBACK_LOGO ? team.logo : side.Logo || team.logo,
});

// A school game's scorekeeper score, logos and phase. The schedule list only has a score when its
// `result` was filled in; the game-detail thread carries both sides' points (one item is enough).
// Upcoming games and games that already have a score make no call.
export function useLiveSides(game: MediaGame): MediaGame {
  const needed = !!game.fromApi && game.status !== "upcoming" && game.homeScore === undefined;
  const { data } = useGameDetail<GameThreadDetail>(needed ? routes.api.gameDetailThread(game.id) : "", { page: 1, limit: 1 });
  if (!needed || !data) return game;
  const [home, away] = [data.Home.Score, data.Away.Score];
  // 0-0 is a game nobody kept score for, not a real score.
  const scored = home != null && away != null && (home > 0 || away > 0);
  return {
    ...game,
    home: withSide(game.home, data.Home),
    away: withSide(game.away, data.Away),
    // The schedule's status wins: many old threads were never closed and still say "live". The thread
    // only turns a listed live game final.
    status: game.status === "live" && data.currentPhase === "final" ? "final" : game.status,
    homeScore: scored ? home : undefined,
    awayScore: scored ? away : undefined,
  };
}
