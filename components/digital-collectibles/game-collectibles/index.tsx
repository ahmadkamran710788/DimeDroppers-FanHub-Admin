import Image from "next/image";
import CollectibleCard from "@/components/digital-collectibles/collectible-card";
import { COLLECTIBLES_SPONSOR, SAMPLE_COLLECTIBLES } from "@/components/digital-collectibles/data";
import type { MediaGame } from "@/components/media/data";
import { fullDate } from "@/components/media/format";
import AddToStore from "@/components/team-shop/add-to-store";

// "Game Collectibles" tab: the selected game's collectible card templates, each sellable in a team shop.
export default function GameCollectibles({ game }: { game: MediaGame }) {
  const cards = SAMPLE_COLLECTIBLES[game.id] ?? [];

  if (cards.length === 0) {
    return <p className="py-10 text-center text-sm text-white/50">Collectibles for this game will appear after tip-off.</p>;
  }

  const gameLabel = `TLAM vs ${game.away.shortName} · ${fullDate(game.start)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3 text-base text-white">
        Presented by
        <Image src={COLLECTIBLES_SPONSOR.logo} alt={COLLECTIBLES_SPONSOR.name} width={86} height={24} className="h-6 w-auto" />
      </div>
      <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <CollectibleCard
            key={c.id}
            collectible={c}
            action={
              <AddToStore
                item={{
                  // The same card template appears per game, so the game is part of its identity.
                  sourceId: `${game.id}:${c.id}`,
                  type: "Collectible",
                  name: c.name,
                  image: c.image,
                  price: c.price,
                  dimes: c.dimes,
                  rarity: c.rarity,
                  game: gameLabel,
                }}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
