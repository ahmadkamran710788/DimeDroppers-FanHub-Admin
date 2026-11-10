"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, Sparkles, Star } from "lucide-react";
import Button from "@/components/common/button";
import ProgressBar from "@/components/common/progress-bar";
import StatusPill from "@/components/common/status-pill";
import SponsorPayments from "@/components/organization/fundable-needs/sponsor-payments";
import TypeChip from "@/components/organization/fundable-needs/type-chip";
import {
  COMING_SOON,
  allowedLabel,
  cardBeingSetUp,
  endsLabel,
  forLabel,
  needStatusPill,
} from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import { routes } from "@/utils/routes";
import type { OrgNeedListItem } from "@/utils/types/needs";

// The row's action buttons: the design's 40px height.
const ACTION = "h-10 px-4 text-[13px]";

interface NeedRowProps {
  need: OrgNeedListItem;
  // Asks to cancel this need (only offered before any sponsor has paid).
  onCancel: () => void;
}

// One need in Existing Needs: what it is and covers, its card, who funded it, what's been raised and spent,
// and the sponsors' payments.
export default function NeedRow({ need, onCancel }: NeedRowProps) {
  const router = useRouter();
  const [showPayments, setShowPayments] = useState(false);
  const { money, card } = need;
  const pill = needStatusPill(need);
  const canCancel = need.status === "OPEN" && money.raisedCents === 0;

  return (
    <article className="flex flex-wrap items-center gap-5 border-b border-white/10 p-4 text-white last:border-b-0 lg:px-6 lg:py-5">
      <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip label={need.category.name} />
          <StatusPill
            label={pill.label}
            color={pill.color}
            className="h-6 px-2.5"
            textClassName="text-[11px] font-bold uppercase tracking-[0.5px]"
          />
          <span className="text-xs text-white/60">{forLabel(need)}</span>
        </div>
        <h4 className="text-[17px] font-semibold break-words">{need.title}</h4>
        <p className="text-sm leading-[1.5] text-white/85 break-words">
          <span className="text-white/60">Covers:</span> {need.description}
        </p>
        {need.allowedCategories.length > 0 && (
          <p className="text-sm leading-[1.5] text-white/85">
            <span className="text-white/60">Allowed categories:</span> {allowedLabel(need.allowedCategories)}
          </p>
        )}
        <span className="text-xs text-white/60">{endsLabel(need)}</span>
        {card &&
          (cardBeingSetUp(card) ? (
            <span className="flex items-center gap-2 self-start rounded-[8px] border border-white/15 px-3 py-1.5 text-[13px] text-white/70">
              <CreditCard className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Virtual card being set up
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              label={`Virtual card •••• ${card.last4 ?? "····"} · ${dollars(money.availableCents)} available`}
              icon={<CreditCard className="size-4" strokeWidth={1.8} />}
              onClick={() => router.push(routes.ui.virtualCard(card.id))}
              // Grows to two lines rather than overflowing on a phone.
              className="h-auto min-h-9 self-start px-3 py-1.5 text-left text-[13px] font-semibold"
            />
          ))}
        {need.sponsors.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-success">
            <span>{`Sponsored by ${need.sponsors.map((s) => `${s.name ?? "A sponsor"} (${dollars(s.totalCents)})`).join(", ")}`}</span>
            <Button
              size="sm"
              variant="text"
              label="On Recognition Wall"
              icon={<Star className="size-3.5" strokeWidth={2} />}
              disabled
              title={COMING_SOON}
              className="text-xs font-semibold text-success"
            />
          </div>
        )}
      </div>

      <div className="flex flex-[1_1_260px] flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-display font-extrabold text-[32px] leading-none">{dollars(money.raisedCents)}</span>
          <span className="text-[13px] text-white/60">
            {`of ${dollars(money.goalCents)} goal · ${need.sponsorCount ? `raised from ${plural(need.sponsorCount, "sponsor")}` : "no sponsors yet"}`}
          </span>
          <ProgressBar
            percent={money.progressPercent}
            ariaLabel={`${need.title} raised`}
            className="mt-1 h-1.5 bg-white/10"
            barClassName="bg-success"
          />
        </div>
        <span className="text-xs text-white/60">
          {`Loaded to card: ${dollars(money.raisedCents)} · spent ${dollars(money.spentCents)} · ${dollars(money.availableCents)} available`}
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            label="Pitch with Sponsor AI"
            icon={<Sparkles className="size-4" strokeWidth={2} />}
            disabled
            title={COMING_SOON}
            className={ACTION}
          />
          <Button size="sm" label="Record funding" disabled title={COMING_SOON} className={ACTION} />
          {need.spendingOpen && (
            <Button
              size="sm"
              label="Edit"
              aria-label={`Edit ${need.title}`}
              onClick={() => router.push(routes.ui.editFundableNeed(need.id))}
              className={ACTION}
            />
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              label="Cancel need"
              aria-label={`Cancel ${need.title}`}
              onClick={onCancel}
              className={cn(ACTION, "text-error")}
            />
          )}
        </div>
      </div>

      {need.sponsorCount > 0 && (
        <div className="flex w-full flex-col gap-3">
          <Button
            size="sm"
            variant="text"
            label={showPayments ? "Hide sponsor payments" : "Sponsor payments"}
            icon={<ChevronDown className={cn("size-4 transition-transform", showPayments && "rotate-180")} strokeWidth={2} />}
            iconPosition="end"
            aria-expanded={showPayments}
            onClick={() => setShowPayments((s) => !s)}
            className="self-start text-[13px] font-semibold text-white/80 hover:text-white"
          />
          {showPayments && <SponsorPayments needId={need.id} />}
        </div>
      )}
    </article>
  );
}
