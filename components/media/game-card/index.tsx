import { ChevronRight, Play } from "lucide-react";
import type { MediaGame, MediaTeam } from "@/components/media/data";
import Image from "next/image";
import { dayOfMonth, monthShort, timeOfDay, weekdayShort } from "@/components/media/format";
import { cn } from "@/utils/cn";

interface GameCardProps {
  game: MediaGame;
  selected: boolean;
  onSelect: () => void;
}

function Team({ team }: { team: MediaTeam }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0 text-center">
      <Image src={team.logo} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
      <span className="text-[15px] leading-[22px] font-medium text-white">{team.shortName}</span>
    </div>
  );
}

// Status pill above the score: Final / Live Now / tip-off time.
function StatusPill({ game }: { game: MediaGame }) {
  if (game.status === "live") {
    return (
      <span className="h-8 px-2.5 rounded-[6px] flex items-center gap-1.5 bg-[#C0182B] text-sm text-white whitespace-nowrap">
        <span className="size-4 rounded-full bg-white flex items-center justify-center">
          <Play className="size-2.5 text-[#C0182B] fill-[#C0182B] ml-px" strokeWidth={0} />
        </span>
        Live Now
      </span>
    );
  }
  return (
    <span className="h-9 px-3.5 rounded-[6px] flex items-center bg-white/10 text-[15px] text-white whitespace-nowrap">
      {game.status === "final" ? "Final" : timeOfDay(game.start)}
    </span>
  );
}

// One game in the Media list: date, both teams, status and score.
export default function GameCard({ game, selected, onSelect }: GameCardProps) {
  const hasScore = game.homeScore !== undefined && game.awayScore !== undefined;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-[10px] p-[1.5px] text-left transition-colors",
        selected ? "bg-[linear-gradient(135deg,#FF34BF,#8B5CF6)]" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[44px_minmax(0,1fr)_96px_minmax(0,1fr)_20px] items-center gap-3 px-4 py-5 rounded-[9px]",
          selected ? "bg-[#1A1530]" : "bg-white/[0.06] hover:bg-white/[0.09]"
        )}
      >
        <div className="flex flex-col items-center text-white">
          <span className="text-sm leading-5">{monthShort(game.start)}</span>
          <span className="font-display font-extrabold text-[32px] leading-9">{dayOfMonth(game.start)}</span>
          <span className="text-sm leading-5">{weekdayShort(game.start)}</span>
        </div>
        <Team team={game.home} />
        <div className={cn("flex flex-col items-center gap-3", !hasScore && "self-start mt-2")}>
          <StatusPill game={game} />
          {hasScore && (
            <span className="font-display font-extrabold text-[32px] leading-none text-white whitespace-nowrap">
              {`${game.homeScore} - ${game.awayScore}`}
            </span>
          )}
        </div>
        <Team team={game.away} />
        <ChevronRight className="size-6 text-white" strokeWidth={1.5} />
      </div>
    </button>
  );
}
