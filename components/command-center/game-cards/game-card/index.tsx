import Link from "next/link";
import { ChevronRight, CirclePlay } from "lucide-react";
import { formatTime, parseGameDate } from "@/components/schedule/game-date";
import TeamSide from "@/components/schedule/team-side";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { ScheduleItem } from "@/utils/types/schedule";

export type GamePhase = "live" | "upcoming" | "final" | "cancelled";

// Games without an end time are treated as finished this long after kick-off.
const DEFAULT_GAME_MS = 2 * 60 * 60 * 1000;

// Where a game stands right now, from its schedule times (the schedule API has no live feed).
export function gamePhase(game: ScheduleItem, now: number): GamePhase {
  if (game.status === "cancelled") return "cancelled";
  const start = new Date(game.start).getTime();
  const end = game.end ? new Date(game.end).getTime() : start + DEFAULT_GAME_MS;
  if (now < start) return "upcoming";
  return now < end ? "live" : "final";
}

interface GameCardProps {
  game: ScheduleItem;
  phase: GamePhase;
  homeName: string;
  homeLogo?: string | null;
  // Live score, home first. The schedule API has none yet, so only preview games pass it.
  score?: [number, number];
}

// One game: date column, both crests, and the live status / final result / kick-off time between them.
export default function GameCard({ game, phase, homeName, homeLogo, score }: GameCardProps) {
  const { day, month, weekday } = parseGameDate(game.start);
  const { time } = formatTime(game.start, game.isAllDay);

  return (
    <Link
      href={routes.ui.gameRecap(game.id)}
      className={cn(
        "flex items-center gap-3 sm:gap-6 rounded-[12px] p-4 sm:px-6 bg-black/50 border border-white/10 transition-colors hover:bg-black/70"
      )}
    >
      <div className="w-10 shrink-0 flex flex-col items-center text-white">
        <span className="text-sm font-medium">{month}</span>
        <span className="font-display font-extrabold text-3xl leading-none">{day}</span>
        <span className="text-sm text-white/80 capitalize">{weekday.toLowerCase()}</span>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <TeamSide name={homeName} logoUrl={homeLogo} size="lg" className="w-24 sm:w-32" />

        <div className="flex flex-col items-center gap-2 text-center">
          {phase === "live" ? (
            <span className="h-8 px-3 rounded-[6px] bg-red-700 flex items-center gap-1.5 text-sm font-semibold text-white whitespace-nowrap">
              <CirclePlay className="size-5 fill-white text-red-700" strokeWidth={2} />
              Live Now
            </span>
          ) : (
            <span className="h-7 px-3 rounded-[6px] bg-white/10 flex items-center text-sm font-medium text-white whitespace-nowrap">
              {phase === "final" ? "Final" : phase === "cancelled" ? "Cancelled" : time}
            </span>
          )}
          {phase === "live" && score && (
            <span className="font-display font-extrabold text-3xl leading-none text-white whitespace-nowrap">{`${score[0]} - ${score[1]}`}</span>
          )}
          {/* The schedule API carries a final result but no live score. */}
          {phase === "final" && game.result && (
            <span className="font-display font-extrabold text-2xl leading-none text-white whitespace-nowrap">{game.result}</span>
          )}
        </div>

        <TeamSide name={game.opponent ?? "TBD"} logoUrl={game.opponentLogoUrl} size="lg" className="w-24 sm:w-32" />
      </div>

      <ChevronRight className="size-5 shrink-0 text-white/70" strokeWidth={1.5} />
    </Link>
  );
}
