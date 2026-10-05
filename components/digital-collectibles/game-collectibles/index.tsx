import Image from "next/image";
import toast from "react-hot-toast";
import CollectibleCard from "@/components/digital-collectibles/collectible-card";
import { COLLECTIBLES_SPONSOR, SAMPLE_COLLECTIBLES } from "@/components/digital-collectibles/data";
import type { MediaGame } from "@/components/media/data";

// "Game Collectibles" tab: the selected game's collectible card templates.
export default function GameCollectibles({ game }: { game: MediaGame }) {
  const cards = SAMPLE_COLLECTIBLES[game.id] ?? [];

  if (cards.length === 0) {
    return <p className="py-10 text-center text-sm text-white/50">Collectibles for this game will appear after tip-off.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3 text-base text-white">
        Presented by
        <Image src={COLLECTIBLES_SPONSOR.logo} alt={COLLECTIBLES_SPONSOR.name} width={86} height={24} className="h-6 w-auto" />
      </div>
      <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          // Card details / purchase flow isn't designed yet.
          <CollectibleCard key={c.id} collectible={c} onSelect={() => toast("Coming soon.")} />
        ))}
      </div>
    </div>
  );
}
