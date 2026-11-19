"use client";

import { FALLBACK_CREST } from "@/utils/constants/fallback-crest";
import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameDetailTeamSide, GameThreadDetail } from "@/utils/types/game-detail";

// The thread's first page: the same request the Game Thread tab makes when nothing is filtered, so the score
// and the open thread share one call.
export const THREAD_FIRST_PAGE = { page: 1, limit: 200 };
// Enough for a list card's score: one item carries both sides' points.
const SCORE_ONLY = { page: 1, limit: 1 };

// Each game's thread already read this session (by game id), so a card keeps its score after another game
// is selected, without asking again.
const readThreads = new Map<string, GameThreadDetail>();

const withSide = (team: MediaTeam, side: GameDetailTeamSide): MediaTeam => ({
  ...team,
  name: side.Team || team.name,
  logo: team.logo && team.logo !== FALLBACK_CREST ? team.logo : side.Logo || team.logo,
});

// A game's scorekeeper score, logos and phase. The schedule list only has a score when its
// `result` was filled in; the game-detail thread carries both sides' points.
// Upcoming games and games that already have a score make no call.
// - `selected` (the hero, and the selected card): reads the thread's first page every time it's picked (a live
//   score moves), the same request the Game Thread tab makes, so they share it.
// - Otherwise (the other list cards): a one-item read, once per game; a score read earlier is reused.
export function useLiveSides(game: MediaGame, selected = true): MediaGame {
  const wanted = !!game.fromApi && game.status !== "upcoming" && game.homeScore === undefined;
  const ask = wanted && (selected || !readThreads.has(game.id));
  const { data: fresh } = useGameDetail<GameThreadDetail>(
    ask ? routes.api.gameDetailThread(game.id) : "",
    selected ? THREAD_FIRST_PAGE : SCORE_ONLY
  );
  if (fresh) readThreads.set(game.id, fresh);
  const data = wanted ? (fresh ?? readThreads.get(game.id)) : undefined;
  if (!data) return game;
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
