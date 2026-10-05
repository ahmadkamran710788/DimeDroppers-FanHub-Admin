import type { MediaGame, MediaTeam } from "@/components/media/data";
import { fullDate, timeOfDay } from "@/components/media/format";
import Image from "next/image";

function Team({ team }: { team: MediaTeam }) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-0 text-center">
      <Image src={team.logo} alt="" width={80} height={80} className="size-16 sm:size-20 shrink-0 rounded-full object-cover" />
      <span className="max-w-[200px] text-base sm:text-lg leading-6 font-semibold text-white">{team.name}</span>
    </div>
  );
}

// Score banner for the selected game, over the stadium backdrop.
export default function GameHero({ game }: { game: MediaGame }) {
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
