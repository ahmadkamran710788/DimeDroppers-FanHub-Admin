import { Calendar } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import TierBadge from "@/components/sponsor/tier-badge";
import { tierLabel, type Tier } from "@/components/sponsor/data";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { PLACE_COLORS, type PackageSlot } from "@/components/sponsor/find-organizations/data";

interface PackageCardProps {
  tier: Tier;
  price: number;
  // Packages of this tier the organization still has.
  left: number;
  games: number;
  season: string;
  slots: PackageSlot[];
  selected: boolean;
  onSelect: () => void;
}

// One tier of an organization's sponsorship packages.
export default function PackageCard({ tier, price, left, games, season, slots, selected, onSelect }: PackageCardProps) {
  const name = tierLabel(tier);
  return (
    <article
      aria-label={`${name} package`}
      className={cn(
        "rounded-[12px] p-4 flex flex-col gap-3 border",
        selected ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#0b0b0b] border-[#262626]"
      )}
    >
      <div className="flex justify-between items-center gap-2">
        <TierBadge tier={tier} size="md" />
        <span className="text-[13px] text-[#a8a8a8]">{left === 1 ? "1 package left" : `${left} packages left`}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Calendar className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        {`${games} expected games · ${season}`}
      </div>
      <div>
        <div className="font-display font-extrabold text-[34px] leading-none">{formatMoney(price)}</div>
        <div className="text-[13px] text-[#a8a8a8]">per season</div>
      </div>
      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">SLOTS INCLUDED</div>
      <ul className="flex flex-col gap-1.5">
        {slots.map((s) => (
          <li key={`${s.place}-${s.slot}`} className="px-[10px] py-2 rounded-[8px] bg-[#1a1a1a] border border-[#2a2a2a]">
            <span className="block text-[11px] font-bold tracking-[1px] uppercase" style={{ color: PLACE_COLORS[s.place] }}>
              {s.place}
            </span>
            <span className="block text-[13px] leading-[1.35] mt-[2px]">{s.slot}</span>
          </li>
        ))}
      </ul>
      {/* mt-auto pins the button to the card bottom, so the cards in a row line up. */}
      <Button
        label={selected ? "Selected" : `Select ${name}`}
        onClick={onSelect}
        aria-pressed={selected}
        fullWidth
        className={cn(
          selected ? PRIMARY_BUTTON : OUTLINE_BUTTON,
          "mt-auto h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none"
        )}
      />
    </article>
  );
}
