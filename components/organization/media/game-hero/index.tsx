"use client";

import TeamAvatar from "@/components/common/team-avatar";
import type { MediaGame, MediaTeam } from "@/components/organization/media/data";
import { fullDate, timeOfDay } from "@/components/organization/media/format";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameDetailTeamSide, GameThreadDetail } from "@/utils/types/game-detail";
import Image from "next/image";

function Team({ team }: { team: MediaTeam }) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-0 text-center">
      <TeamAvatar name={team.name} logo={team.logo} size={80} className="size-16 sm:size-20" />
      <span className="max-w-[200px] text-base sm:text-lg leading-6 font-semibold text-white">{team.name}</span>
    </div>
  );
}

const withSide = (team: MediaTeam, side: GameDetailTeamSide): MediaTeam => ({
  ...team,
  name: side.Team || team.name,
  logo: side.Logo || team.logo,
});

// A school game's score, logos and phase: the game-detail thread answer carries both sides (one item is
// enough). The schedule list the game came from has none of these.
function useLiveSides(game: MediaGame): MediaGame {
  const { data } = useGameDetail<GameThreadDetail>(game.fromApi ? routes.api.gameDetailThread(game.id) : "", { page: 1, limit: 1 });
  if (!data) return game;
  const started = data.currentPhase !== "pre";
  return {
    ...game,
    home: withSide(game.home, data.Home),
    away: withSide(game.away, data.Away),
    status: data.currentPhase === "final" ? "final" : data.currentPhase === "live" ? "live" : "upcoming",
    homeScore: started ? data.Home.Points : undefined,
    awayScore: started ? data.Away.Points : undefined,
  };
}

// Score banner for the selected game, over the stadium backdrop.
export default function GameHero({ game: listed }: { game: MediaGame }) {
  const game = useLiveSides(listed);
  const hasScore = game.homeScore !== undefined && game.awayScore !== undefined;
  const label = game.status === "final" ? "Final" : game.status === "live" ? "Live Now" : timeOfDay(game.start);

  return (
    <div className="relative rounded-[12px] overflow-hidden border border-white/10">
      <Image src="/images/highlights/hero-bg.jpg" alt="" aria-hidden fill sizes="(max-width: 1280px) 100vw, 60vw" className="object-cover grayscale" />
      <div className="absolute inset-0 bg-[#0B1424]/45" />
      <span className="absolute top-4 right-4 h-9 px-3.5 rounded-[8px] flex items-center bg-black/50 text-sm text-white">
        {fullDate(game.start)}
      </span>

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 sm:px-8 pt-14 pb-6 sm:py-16">
        <Team team={game.home} />
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 px-3.5 rounded-[8px] flex items-center bg-[#0B1424]/80 text-[15px] text-white whitespace-nowrap">
            {label}
          </span>
          <span className="font-display font-extrabold text-[44px] sm:text-[64px] leading-none text-white whitespace-nowrap">
            {hasScore ? (
              <>
                {game.homeScore}
                <span className="mx-4 sm:mx-8">-</span>
                {game.awayScore}
              </>
            ) : (
              "VS"
            )}
          </span>
        </div>
        <Team team={game.away} />
      </div>
    </div>
  );
}
