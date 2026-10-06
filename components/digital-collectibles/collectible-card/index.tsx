import type { ReactNode } from "react";
import Image from "next/image";
import { CircleDot, Volleyball } from "lucide-react";
import type { Collectible } from "@/components/digital-collectibles/data";
import { formatMoney } from "@/utils/helper";

interface CollectibleCardProps {
  collectible: Collectible;
  // Optional footer action, e.g. "Add to Store".
  action?: ReactNode;
}

// One digital collectible card template: artwork with rarity badge, name and price.
export default function CollectibleCard({ collectible, action }: CollectibleCardProps) {
  return (
    <div className="rounded-[14px] overflow-hidden border-2 border-white/20 bg-[#151519] flex flex-col">
      <div className="relative aspect-[239/266] bg-[#0E7C86]">
        <Image
          src={collectible.image}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1536px) 25vw, 220px"
          className="object-cover"
        />
        <span className="absolute top-3 left-3 h-8 px-3 rounded-full flex items-center gap-1.5 bg-[#0E7C86] text-sm font-medium text-white">
          <Volleyball className="size-4" strokeWidth={2} />
          {collectible.rarity}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-base text-white/90">{collectible.name}</span>
          <span className="flex items-center gap-1.5 text-lg text-white">
            {formatMoney(collectible.price)}
            <span className="text-white/60">/</span>
            <CircleDot className="size-5 text-[#C04BF2]" strokeWidth={2.5} />
            {collectible.dimes.toLocaleString("en-US")}
          </span>
        </div>
        {action}
      </div>
    </div>
  );
}
