"use client";

import { Eye, EyeOff, Snowflake } from "lucide-react";
import Button from "@/components/common/button";
import ProgressBar from "@/components/common/progress-bar";
import { cardBeingSetUp } from "@/components/organization/fundable-needs/data";
import { dollars } from "@/utils/needs";
import { stripeEnabled } from "@/utils/stripe";
import type { OrgCardListItem } from "@/utils/types/needs";

interface CardBalanceProps {
  item: OrgCardListItem;
  revealed: boolean;
  // A freeze / unfreeze is on its way.
  freezing: boolean;
  onToggleReveal: () => void;
  onToggleFreeze: () => void;
}

// What's left on the card for the need it serves now, how much of the sponsors' money is spent, and the
// card's controls.
export default function CardBalance({ item, revealed, freezing, onToggleReveal, onToggleFreeze }: CardBalanceProps) {
  const { card, currentNeed, category } = item;
  const money = currentNeed?.money;
  const raised = money?.raisedCents ?? 0;
  const spent = money?.spentCents ?? 0;
  const settingUp = cardBeingSetUp(card);
  // Stripe draws the details; only for a card that exists at Stripe and serves this need.
  const canReveal = !!card.stripeCardId && card.servesThisNeed && !!currentNeed && stripeEnabled();
  // Freezing works while the need is still running.
  const canFreeze = !!currentNeed?.spendingOpen && !settingUp;

  return (
    <div className="flex flex-[1_1_220px] flex-col gap-3 text-white">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[1px] text-white/60">Available balance</span>
        <span className="font-display font-extrabold text-[40px] leading-none">{dollars(money?.availableCents ?? 0)}</span>
        <span className="text-[13px] text-white/60">
          {currentNeed
            ? `${dollars(spent)} spent of ${dollars(raised)} loaded by sponsors`
            : `Waiting for your next ${category.name} need`}
        </span>
      </div>
      <ProgressBar percent={raised ? (spent / raised) * 100 : 0} ariaLabel="Card spent" barClassName="bg-[#638BFE]" />
      {settingUp && (
        <p className="text-[13px] leading-[1.5] text-white/70">
          Stripe is still setting up this card. It retries by itself, and the card works once it&apos;s ready.
        </p>
      )}
      <div className="flex flex-wrap gap-2.5 pt-1">
        {canReveal && (
          <Button
            label={revealed ? "Hide card details" : "Show card details"}
            icon={revealed ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            onClick={onToggleReveal}
          />
        )}
        <Button
          variant={card.frozen ? "primary" : "ghost"}
          label={freezing ? "Saving…" : card.frozen ? "Unfreeze card" : "Freeze card"}
          icon={<Snowflake className="size-5" />}
          onClick={onToggleFreeze}
          disabled={!canFreeze || freezing}
          title={canFreeze ? undefined : "Only while the card serves a need that's still running"}
        />
      </div>
    </div>
  );
}
