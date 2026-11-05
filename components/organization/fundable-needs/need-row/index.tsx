"use client";

import { useRouter } from "next/navigation";
import { CreditCard, Sparkles, Star } from "lucide-react";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import RecordFunding from "@/components/organization/fundable-needs/record-funding";
import TypeChip from "@/components/organization/fundable-needs/type-chip";
import {
  NEED_STATUS_LABELS,
  allowedLabel,
  forLabel,
  raisedOf,
  spentOf,
  statusOf,
} from "@/components/organization/fundable-needs/data";
import { formatMoney, plural } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { FundableNeed } from "@/utils/types/fundable-need";

// The row's action buttons: the design's 40px height.
const ACTION = "h-10 px-4 text-[13px]";

interface NeedRowProps {
  need: FundableNeed;
  // The Record funding panel is open under this need.
  funding: boolean;
  onStartFunding: () => void;
  onCancelFunding: () => void;
  onFund: (sponsor: string, amount: number) => void;
}

// One need in Existing Needs: what it is and covers, its card, who funded it, and what's been raised.
export default function NeedRow({ need, funding, onStartFunding, onCancelFunding, onFund }: NeedRowProps) {
  const router = useRouter();
  const status = statusOf(need);
  const raised = raisedOf(need);
  const spent = spentOf(need.card);
  const sponsors = need.contributions.length;

  return (
    <article className="flex flex-wrap items-center gap-5 border-b border-white/10 p-4 text-white last:border-b-0 lg:px-6 lg:py-5">
      <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip label={need.type} />
          <StatusPill
            label={NEED_STATUS_LABELS[status]}
            color={status === "open" ? "bg-[#FFC857]" : "bg-success"}
            className="h-6 px-2.5"
            textClassName="text-[11px] font-bold uppercase tracking-[0.5px]"
          />
          <span className="text-xs text-white/60">{forLabel(need)}</span>
        </div>
        <h4 className="text-[17px] font-semibold">{need.title}</h4>
        <p className="text-sm leading-[1.5] text-white/85">
          <span className="text-white/60">Covers:</span> {need.covers}
        </p>
        <p className="text-sm leading-[1.5] text-white/85">
          <span className="text-white/60">Allowed categories:</span> {allowedLabel(need)}
        </p>
        <Button
          size="sm"
          variant="outline"
          label={`Virtual card •••• ${need.card.last4} · ${formatMoney(raised - spent)} available`}
          icon={<CreditCard className="size-4" strokeWidth={1.8} />}
          onClick={() => router.push(routes.ui.virtualCard(need.id))}
          // Grows to two lines rather than overflowing on a phone.
          className="h-auto min-h-9 self-start px-3 py-1.5 text-left text-[13px] font-semibold"
        />
        {sponsors > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-success">
            <span>
              {`Sponsored by ${need.contributions.map((c) => `${c.sponsor} (${formatMoney(c.amount)})`).join(", ")}`}
            </span>
            <Button
              size="sm"
              variant="text"
              label="On Recognition Wall"
              icon={<Star className="size-3.5" strokeWidth={2} />}
              onClick={() => router.push(routes.ui.recognition)}
              className="text-xs font-semibold text-success hover:text-white"
            />
          </div>
        )}
      </div>

      <div className="flex flex-[1_1_260px] flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-display font-extrabold text-[32px] leading-none">{formatMoney(raised)}</span>
          <span className="text-[13px] text-white/60">
            {sponsors ? `raised from ${plural(sponsors, "sponsor")}` : "no sponsors yet"}
          </span>
        </div>
        <span className="text-xs text-white/60">
          {`Loaded to card: ${formatMoney(raised)} · spent ${formatMoney(spent)} · ${formatMoney(raised - spent)} available`}
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            label="Pitch with Sponsor AI"
            icon={<Sparkles className="size-4" strokeWidth={2} />}
            onClick={() => router.push(routes.ui.sponsorAiAgent)}
            className={ACTION}
          />
          <Button size="sm" label="Record funding" onClick={onStartFunding} disabled={funding} className={ACTION} />
          <Button
            size="sm"
            label="Edit"
            aria-label={`Edit ${need.title}`}
            onClick={() => router.push(routes.ui.editFundableNeed(need.id))}
            className={ACTION}
          />
        </div>
      </div>

      {funding && <RecordFunding need={need} onCancel={onCancelFunding} onFund={onFund} />}
    </article>
  );
}
