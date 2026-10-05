"use client";

import GameDetails from "@/components/media/game-details";
import GamesBrowser from "@/components/media/games-browser";
import GameThread from "@/components/media/game-thread";

const CONTENT_TABS = ["Game Thread", "Game Details"] as const;

// Media: pick a game on the left, see its score, play-by-play thread and recap on the right.
export default function MediaPage() {
  return (
    <GamesBrowser
      title="Media"
      description="View media, highlights and game content for your games."
      tabs={CONTENT_TABS}
      renderContent={(tab, game) => (tab === "Game Thread" ? <GameThread game={game} /> : <GameDetails game={game} />)}
    />
  );
}
