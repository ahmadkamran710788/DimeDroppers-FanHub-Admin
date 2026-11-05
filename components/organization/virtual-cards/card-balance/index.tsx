"use client";

import { Eye, EyeOff, Snowflake } from "lucide-react";
import Button from "@/components/common/button";
import ProgressBar from "@/components/common/progress-bar";
import { raisedOf, spentOf } from "@/components/organization/fundable-needs/data";
import { formatMoney } from "@/utils/helper";
import type { FundableNeed } from "@/utils/types/fundable-need";

interface CardBalanceProps {
  need: FundableNeed;
  revealed: boolean;
  onToggleReveal: () => void;
  onToggleFreeze: () => void;
}

// What's left on the card, how much of the sponsors' money is spent, and the card's controls.
export default function CardBalance({ need, revealed, onToggleReveal, onToggleFreeze }: CardBalanceProps) {
  const raised = raisedOf(need);
  const spent = spentOf(need.card);
  const { frozen } = need.card;
  return (
    <div className="flex flex-[1_1_220px] flex-col gap-3 text-white">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[1px] text-white/60">Available balance</span>
        <span className="font-display font-extrabold text-[40px] leading-none">{formatMoney(raised - spent)}</span>
        <span className="text-[13px] text-white/60">{`${formatMoney(spent)} spent of ${formatMoney(raised)} loaded by sponsors`}</span>
      </div>
      <ProgressBar percent={raised ? (spent / raised) * 100 : 0} ariaLabel="Card spent" barClassName="bg-[#638BFE]" />
      <div className="flex flex-wrap gap-2.5 pt-1">
        <Button
          label={revealed ? "Hide card details" : "Show card details"}
          icon={revealed ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          onClick={onToggleReveal}
        />
        <Button
          variant={frozen ? "primary" : "ghost"}
          label={frozen ? "Unfreeze card" : "Freeze card"}
          icon={<Snowflake className="size-5" />}
          onClick={onToggleFreeze}
        />
      </div>
    </div>
  );
}
