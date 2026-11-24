import { gameTime } from "@/components/sponsor/package-splits/data";
import type { SplitGame } from "@/utils/types/sponsor-packages";

interface GamesDetailsProps {
  games: SplitGame[];
  // "See games" by default.
  label?: string;
  className?: string;
}

// A package part's games, folded under "See games": each game's day and time, and its title.
export default function GamesDetails({ games, label = "See games", className }: GamesDetailsProps) {
  if (!games?.length) return null;
  return (
    <details className={className}>
      <summary className="cursor-pointer text-xs text-[#c9b8ff] hover:text-white w-fit">{label}</summary>
      <ul className="mt-1.5 flex flex-col gap-1">
        {games.map((game, i) => (
          <li key={game.id ?? `game-${i}`} className="text-xs text-[#c4c4c4] flex flex-wrap gap-x-2">
            <span className="text-[#a8a8a8] whitespace-nowrap">{gameTime(game)}</span>
            <span className="min-w-0 break-words">{game.title ?? "Game"}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
