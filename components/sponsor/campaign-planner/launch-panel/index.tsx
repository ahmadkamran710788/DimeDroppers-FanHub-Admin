import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";

const SECONDARY = cn(OUTLINE_BUTTON, "flex-[1_1_120px] h-[52px] px-4 rounded-[12px] text-[15px] font-semibold");

interface LaunchPanelProps {
  // Packages in the plan.
  count: number;
  total: number;
  onBuy: () => void;
}

// Checkout for the plan: buy every package at once, save it, or export it.
export default function LaunchPanel({ count, total, onBuy }: LaunchPanelProps) {
  return (
    <SectionCard
      title="Ready to launch"
      className="flex-[1_1_380px] min-w-0 bg-[#17151f] border border-[#4a3f7a] backdrop-blur-none gap-[14px]"
    >
      <p className="text-[15px] text-[#d4d4d4] leading-[1.55]">
        Buying sends each organization its package request. Your brand assets are attached automatically, and each
        organization confirms before you’re charged.
      </p>
      <div className="flex justify-between items-baseline gap-3 border-t border-[#2c2547] pt-3">
        <span className="text-[15px] text-[#c4c4c4]">{count === 1 ? "1 package" : `${count} packages`}</span>
        <span className="font-display font-extrabold text-[40px] leading-none">{formatMoney(total)}</span>
      </div>
      {/* mt-auto keeps the buttons at the card bottom when the inventory mix beside it is taller. */}
      <div className="flex flex-wrap gap-[10px] mt-auto">
        <Button
          label="Buy full package"
          onClick={onBuy}
          disabled={count === 0}
          className={cn(PRIMARY_BUTTON, "flex-[1_1_180px] h-[52px] px-4 rounded-[12px] text-base")}
        />
        <Button label="Save draft" onClick={() => toast.success("Draft saved")} className={SECONDARY} />
        <Button label="Export PDF" onClick={() => toast("Coming soon.")} className={SECONDARY} />
      </div>
    </SectionCard>
  );
}
