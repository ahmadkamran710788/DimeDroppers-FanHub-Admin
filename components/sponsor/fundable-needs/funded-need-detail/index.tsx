import { cn } from "@/utils/cn";
import { formatInstantDate } from "@/utils/helper";
import ProgressBar from "@/components/common/progress-bar";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { CARD } from "@/components/sponsor/styles";
import { NEED_STATUS_LABEL, daysLeftLabel, dollars } from "@/components/sponsor/fundable-needs/data";
import type { SponsorFundedNeed } from "@/utils/types/needs";

// Small caps label on a stat tile ("GOAL", "RAISED").
const TILE_LABEL = "text-xs font-bold tracking-[1px] text-[#a8a8a8]";
const TILE_VALUE = "mt-1 font-display font-extrabold text-[28px] leading-[1.1]";
const TILE = "bg-[#0b0b0b] border border-[#262626] rounded-[8px] px-4 py-[14px]";
const TILE_NOTE = "mt-0.5 text-[13px] text-[#bdbdbd]";
const TILES = "grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3";

// "on Nov 9, 2026", or the first and last day when the sponsor paid more than once on different days.
function paidOn({ firstPaidAt, lastPaidAt }: SponsorFundedNeed) {
  const first = formatInstantDate(firstPaidAt);
  const last = formatInstantDate(lastPaidAt);
  return first === last ? `on ${first}` : `${first} – ${last}`;
}

// The funded need: what you gave and when, what it's for, how far it is toward its goal, and how much of
// your money has been used, is left, or came back to you.
export default function FundedNeedDetail({ funded }: { funded: SponsorFundedNeed }) {
  const { need, organization } = funded;
  const { money } = need;
  // Still raising or spending; afterwards the need's state replaces the countdown.
  const running = need.status === "OPEN" || need.status === "FUNDED";
  return (
    <div className={cn(CARD, "rounded-[8px] p-[22px] flex flex-col gap-[18px] text-white")}>
      <div className="flex flex-wrap gap-[18px] items-center justify-between">
        <div className="flex gap-4 items-center min-w-0">
          <OrgMonogram logoUrl={organization.logoUrl} size="md" />
          <div className="min-w-0">
            <div className="text-[14px] text-[#bdbdbd]">{organization.name}</div>
            <h3 className="font-display font-extrabold text-2xl lg:text-[30px] uppercase leading-[1.05] break-words">
              {need.title}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold tracking-[1px] text-[#c4c4c4]">YOU FUNDED</div>
          <div className="font-display font-extrabold text-[40px] leading-none">{dollars(funded.yourContributionCents)}</div>
          <div className="text-[13px] text-[#bdbdbd]">{paidOn(funded)}</div>
        </div>
      </div>

      <p className="text-base leading-[1.55] text-[#d4d4d4] max-w-[760px] whitespace-pre-line">{need.description}</p>

      <div className={TILES}>
        <div className={TILE}>
          <div className={TILE_LABEL}>GOAL</div>
          <div className={TILE_VALUE}>{dollars(money.goalCents)}</div>
        </div>
        <div className={TILE}>
          <div className={TILE_LABEL}>RAISED</div>
          <div className={TILE_VALUE}>
            {dollars(money.raisedCents)}{" "}
            <span className="font-sans font-normal text-[14px] text-[#bdbdbd]">{`${money.progressPercent}%`}</span>
          </div>
          <ProgressBar
            percent={money.progressPercent}
            ariaLabel={`${need.title} raised`}
            className="h-1.5 mt-2"
            barClassName="bg-[#7cc97e]"
          />
        </div>
        <div className={TILE}>
          <div className={TILE_LABEL}>{running ? "ENDS" : "ENDED"}</div>
          <div className={TILE_VALUE}>{formatInstantDate(need.endsAt)}</div>
          <div className={TILE_NOTE}>{running ? daysLeftLabel(need.daysLeft) : NEED_STATUS_LABEL[need.status]}</div>
        </div>
      </div>

      <div className={TILES}>
        <div className={TILE}>
          <div className={TILE_LABEL}>YOUR MONEY USED</div>
          <div className={TILE_VALUE}>{dollars(funded.yourUtilizedCents)}</div>
          <div className={TILE_NOTE}>your share of the purchases</div>
        </div>
        <div className={TILE}>
          <div className={TILE_LABEL}>LEFT</div>
          <div className={TILE_VALUE}>{dollars(funded.yourRemainingCents)}</div>
          <div className={TILE_NOTE}>refunded to you after the event</div>
        </div>
        <div className={TILE}>
          <div className={TILE_LABEL}>REFUNDED TO YOU</div>
          <div className={TILE_VALUE}>{dollars(funded.yourRefundedCents)}</div>
        </div>
      </div>
    </div>
  );
}
