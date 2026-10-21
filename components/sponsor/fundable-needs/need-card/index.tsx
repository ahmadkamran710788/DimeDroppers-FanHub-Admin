import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import ProgressBar from "@/components/common/progress-bar";
import OrgCrest from "@/components/sponsor/org-crest";
import type { FundableNeed } from "@/components/sponsor/fundable-needs/data";

// A need closing within this many days shows its deadline in orange.
const URGENT_DAYS = 10;

interface NeedCardProps {
  need: FundableNeed;
  selected: boolean;
  onSelect: () => void;
}

export default function NeedCard({ need, selected, onSelect }: NeedCardProps) {
  const percent = Math.round((need.raised / need.goal) * 100);
  return (
    <article
      className={cn(
        "rounded-[8px] p-6 flex flex-col gap-4 border",
        selected ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#141414] border-[#222]"
      )}
    >
      <div className="flex justify-between gap-2 items-center">
        <span className="text-[12px] font-bold tracking-[1.2px] px-[10px] py-[5px] rounded-full bg-[#1f1f1f] text-[#e0e0e0]">
          {need.category}
        </span>
        <span className={cn("text-[13px] font-semibold", need.daysLeft <= URGENT_DAYS ? "text-[#ffb27a]" : "text-[#a8a8a8]")}>
          {`${need.daysLeft} days left`}
        </span>
      </div>
      <div className="flex gap-[14px] items-center">
        <OrgCrest orgName={need.org} color={need.color} trim={need.trim} width={48} height={56} />
        <div className="min-w-0">
          <div className="text-[14px] text-[#bdbdbd]">{need.org}</div>
          <h3 className="mt-1 text-[19px] leading-[1.25] font-bold">{need.title}</h3>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ProgressBar percent={percent} ariaLabel={`${need.title} funded`} barClassName="bg-[#7cc97e]" />
        <div className="flex justify-between text-[14px]">
          <span>
            <strong>{formatMoney(need.raised)}</strong> <span className="text-[#a8a8a8]">of {formatMoney(need.goal)}</span>
          </span>
          <span className="text-[#a8a8a8]">{`${percent}%`}</span>
        </div>
      </div>
      <div className="text-[14px] text-[#d4d4d4] leading-[1.45]">
        <span className="text-[#a8a8a8]">You get:</span> {need.recognition}
      </div>
      <Button
        label={selected ? "Selected" : "Fund this need"}
        onClick={onSelect}
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
