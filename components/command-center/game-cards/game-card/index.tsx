import Link from "next/link";
import { ChevronRight, CirclePlay } from "lucide-react";
import { parseGameDate } from "@/components/schedule/game-date";
import TeamSide from "@/components/schedule/team-side";
import { routes } from "@/utils/routes";
import type { LiveGame } from "@/utils/types/command-center";

// One live game: date column, both crests, and the "Live Now" badge (or "Final" once the
// scorekeeper ended it) with the official score between them. Opens the game's recap.
export default function GameCard({ game }: { game: LiveGame }) {
  const { day, month, weekday } = parseGameDate(game.start);
  const ended = game.matchStatus === "final" || !!game.live.endedAt;

  return (
    <Link
      href={routes.ui.gameRecap(game.id)}
      className="flex items-center gap-3 sm:gap-6 rounded-[12px] p-4 sm:px-6 bg-black/50 border border-white/10 transition-colors hover:bg-black/70"
    >
      <div className="w-10 shrink-0 flex flex-col items-center text-white">
        <span className="text-sm font-medium">{month}</span>
        <span className="font-display font-extrabold text-3xl leading-none">{day}</span>
        <span className="text-sm text-white/80 capitalize">{weekday.toLowerCase()}</span>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <TeamSide name={game.home?.name ?? "TBD"} logoUrl={game.home?.logoUrl} size="lg" className="w-24 sm:w-32" />

        <div className="flex flex-col items-center gap-2 text-center">
          {ended ? (
            <span className="h-7 px-3 rounded-[6px] bg-white/10 flex items-center text-sm font-medium text-white whitespace-nowrap">Final</span>
          ) : (
            <span className="h-8 px-3 rounded-[6px] bg-red-700 flex items-center gap-1.5 text-sm font-semibold text-white whitespace-nowrap">
              <CirclePlay className="size-5 fill-white text-red-700" strokeWidth={2} />
              Live Now
            </span>
          )}
          <span className="font-display font-extrabold text-3xl leading-none text-white whitespace-nowrap">
            {`${game.live.homePoints} - ${game.live.awayPoints}`}
          </span>
          <span className="text-xs text-white/60 whitespace-nowrap">
            {`${game.live.viewers.toLocaleString("en-US")} ${game.live.viewers === 1 ? "viewer" : "viewers"}`}
          </span>
        </div>

        <TeamSide name={game.away?.name ?? "TBD"} logoUrl={game.away?.logoUrl} size="lg" className="w-24 sm:w-32" />
      </div>

      <ChevronRight className="size-5 shrink-0 text-white/70" strokeWidth={1.5} />
    </Link>
  );
}
