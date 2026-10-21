import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import { tierLabel, type Tier } from "@/components/sponsor/data";
import { PRIMARY_BUTTON } from "@/components/sponsor/styles";

interface OrderSummaryProps {
  tier: Tier;
  packagePrice: number;
  // Ticked physical add-ons and what they add.
  addOnCount: number;
  addOnTotal: number;
  onBuy: () => void;
}

// The picked package plus add-ons, per season, and the Buy button.
export default function OrderSummary({ tier, packagePrice, addOnCount, addOnTotal, onBuy }: OrderSummaryProps) {
  return (
    <div className="bg-[#17151f] border border-[#4a3f7a] rounded-[12px] p-[18px] flex flex-col gap-[10px]">
      <div className="text-[13px] font-bold tracking-[1px]">ORDER SUMMARY</div>
      <div className="flex justify-between gap-3 text-[15px]">
        <span className="text-[#c4c4c4]">{`${tierLabel(tier)} package`}</span>
        <span>{formatMoney(packagePrice)}</span>
      </div>
      <div className="flex justify-between gap-3 text-[15px]">
        <span className="text-[#c4c4c4]">{`Physical add-ons (${addOnCount})`}</span>
        <span>{formatMoney(addOnTotal)}</span>
      </div>
      <div className="flex justify-between items-center gap-3 flex-wrap border-t border-[#2c2547] pt-3 mt-1">
        <div>
          <div className="text-[13px] text-[#a8a8a8]">Total per season</div>
          <div className="font-display font-extrabold text-[38px] leading-none">{formatMoney(packagePrice + addOnTotal)}</div>
        </div>
        <Button label="Buy package" onClick={onBuy} className={cn(PRIMARY_BUTTON, "h-[52px] px-6 rounded-[12px] text-base")} />
      </div>
    </div>
  );
}
