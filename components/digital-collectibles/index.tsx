"use client";

import GameCollectibles from "@/components/digital-collectibles/game-collectibles";
import GamesBrowser from "@/components/media/games-browser";

const CONTENT_TABS = ["Game Collectibles"] as const;

// Digital Collectibles: same games layout as Media, with each game's collectible cards.
export default function DigitalCollectiblesPage() {
  return (
    <GamesBrowser
      title="Digital Collectibles"
      description="Create and manage digital collectibles for your games and fans."
      tabs={CONTENT_TABS}
      renderContent={(_tab, game) => <GameCollectibles game={game} />}
    />
  );
}
