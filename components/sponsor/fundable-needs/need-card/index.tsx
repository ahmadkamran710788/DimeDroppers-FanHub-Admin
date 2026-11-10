import { MapPin } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ProgressBar from "@/components/common/progress-bar";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { URGENT_DAYS, daysLeftLabel, dollars, placeLabel } from "@/components/sponsor/fundable-needs/data";
import type { SponsorNeedListItem } from "@/utils/types/needs";

interface NeedCardProps {
  need: SponsorNeedListItem;
  selected: boolean;
  onSelect: () => void;
}

// "3.4 mi from Jacksonville store": the closest of the sponsor's own stores, when the list is by area.
function nearestStore(need: SponsorNeedListItem) {
  const store = need.nearLocations[0];
  if (!store) return null;
  const name = store.name || placeLabel(store.city, store.state) || "your store";
  return `${store.distanceMiles.toFixed(1)} mi from ${name}`;
}

export default function NeedCard({ need, selected, onSelect }: NeedCardProps) {
  const { money } = need;
  const place = placeLabel(need.location.city, need.location.state);
  const near = nearestStore(need);
  return (
    <article
      className={cn(
        "rounded-[8px] p-6 flex flex-col gap-4 border",
        selected ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#141414] border-[#222]"
      )}
    >
      <div className="flex justify-between gap-2 items-center">
        <span className="text-[12px] font-bold tracking-[1.2px] uppercase px-[10px] py-[5px] rounded-full bg-[#1f1f1f] text-[#e0e0e0] truncate">
          {need.category.name}
        </span>
        <span
          className={cn(
            "flex-none text-[13px] font-semibold",
            need.daysLeft <= URGENT_DAYS ? "text-[#ffb27a]" : "text-[#a8a8a8]"
          )}
        >
          {daysLeftLabel(need.daysLeft)}
        </span>
      </div>
      <div className="flex gap-[14px] items-center">
        <OrgMonogram logoUrl={need.organization.logoUrl} size="sm" />
        <div className="min-w-0">
          <div className="text-[14px] text-[#bdbdbd] truncate">{need.organization.name}</div>
          <h3 className="mt-1 text-[19px] leading-[1.25] font-bold break-words">{need.title}</h3>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ProgressBar percent={money.progressPercent} ariaLabel={`${need.title} funded`} barClassName="bg-[#7cc97e]" />
        <div className="flex justify-between text-[14px]">
          <span>
            <strong>{dollars(money.raisedCents)}</strong>{" "}
            <span className="text-[#a8a8a8]">of {dollars(money.goalCents)}</span>
          </span>
          <span className="text-[#a8a8a8]">{`${money.progressPercent}%`}</span>
        </div>
      </div>
      {(place || near) && (
        <div className="flex gap-2 items-start text-[14px] text-[#d4d4d4] leading-[1.45]">
          <MapPin aria-hidden="true" className="size-4 flex-none mt-[3px] text-[#a8a8a8]" />
          <span>{[place, near].filter(Boolean).join(" · ")}</span>
        </div>
      )}
      <Button
        label={selected ? "Selected" : "Fund this need"}
        onClick={onSelect}
        aria-pressed={selected}
        fullWidth
        className={cn(
          // mt-auto pins the button to the card bottom, so every card in a row lines up.
          "mt-auto h-11 min-w-0 px-[6px] rounded-[10px] text-[15px] font-semibold text-white border backdrop-blur-none transition-none",
          selected ? "bg-[#2a2148] border-[#8b6dff]" : "bg-transparent border-[#3a3a3a]"
        )}
      />
    </article>
  );
}
