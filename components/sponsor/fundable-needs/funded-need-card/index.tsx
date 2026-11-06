import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import OrgCrest from "@/components/sponsor/org-crest";
import { CARD } from "@/components/sponsor/styles";
import type { FundableNeed } from "@/components/sponsor/fundable-needs/data";

interface FundedNeedCardProps {
  need: FundableNeed;
  // What this sponsor gave.
  amount: number;
  selected: boolean;
  onSelect: () => void;
}

// One need the sponsor has funded, in the My funded needs list; picking it shows its spending.
export default function FundedNeedCard({ need, amount, selected, onSelect }: FundedNeedCardProps) {
  return (
    // A clickable card (shows this need's spending), not an action button.
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full rounded-[8px] border p-[18px] flex flex-col text-left text-white",
        selected ? "bg-[#17151f] border-[#8b6dff]" : CARD
      )}
    >
      <span className="flex gap-3 items-center">
        <OrgCrest orgName={need.org} color={need.color} trim={need.trim} width={34} height={40} />
        <span className="min-w-0 flex flex-col gap-0.5">
          <span className="text-base font-semibold">{need.title}</span>
          <span className="text-[13px] text-[#bdbdbd]">{need.org}</span>
        </span>
      </span>
      <span className="mt-3 pt-3 border-t border-[#262626] flex justify-between items-baseline gap-3">
        <span className="text-[13px] text-[#bdbdbd]">You funded</span>
        <span className="font-display font-extrabold text-[26px] leading-none">{formatMoney(amount)}</span>
      </span>
    </button>
  );
}
