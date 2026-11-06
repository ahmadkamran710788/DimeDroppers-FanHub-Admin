import { cn } from "@/utils/cn";
import { formatMoney, formatShortDate } from "@/utils/helper";
import ProgressBar from "@/components/common/progress-bar";
import OrgCrest from "@/components/sponsor/org-crest";
import { CARD } from "@/components/sponsor/styles";
import type { FundableNeed, FundedNeed } from "@/components/sponsor/fundable-needs/data";

// Small caps label on a stat tile ("GOAL", "RAISED").
const TILE_LABEL = "text-xs font-bold tracking-[1px] text-[#a8a8a8]";
const TILE_VALUE = "mt-1 font-display font-extrabold text-[28px] leading-[1.1]";

interface FundedNeedDetailProps {
  need: FundableNeed;
  funded: FundedNeed;
}

// The funded need: what you gave and when, what it's for, and how far it is toward its goal.
export default function FundedNeedDetail({ need, funded }: FundedNeedDetailProps) {
  const percent = Math.round((need.raised / need.goal) * 100);
  return (
    <div className={cn(CARD, "rounded-[8px] p-[22px] flex flex-col gap-[18px] text-white")}>
      <div className="flex flex-wrap gap-[18px] items-center justify-between">
        <div className="flex gap-4 items-center min-w-0">
          <OrgCrest orgName={need.org} color={need.color} trim={need.trim} width={52} height={60} />
          <div className="min-w-0">
            <div className="text-[14px] text-[#bdbdbd]">{need.org}</div>
            <h3 className="font-display font-extrabold text-2xl lg:text-[30px] uppercase leading-[1.05] break-words">
              {need.title}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold tracking-[1px] text-[#c4c4c4]">YOU FUNDED</div>
          <div className="font-display font-extrabold text-[40px] leading-none">{formatMoney(funded.amount)}</div>
          <div className="text-[13px] text-[#bdbdbd]">{`on ${formatShortDate(funded.fundedOn)}`}</div>
        </div>
      </div>

      <p className="text-base leading-[1.55] text-[#d4d4d4] max-w-[760px]">{funded.description}</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <div className="bg-[#0b0b0b] border border-[#262626] rounded-[8px] px-4 py-[14px]">
          <div className={TILE_LABEL}>GOAL</div>
          <div className={TILE_VALUE}>{formatMoney(need.goal)}</div>
        </div>
        <div className="bg-[#0b0b0b] border border-[#262626] rounded-[8px] px-4 py-[14px]">
          <div className={TILE_LABEL}>RAISED</div>
          <div className={TILE_VALUE}>
            {formatMoney(need.raised)} <span className="font-sans font-normal text-[14px] text-[#bdbdbd]">{`${percent}%`}</span>
          </div>
          <ProgressBar percent={percent} ariaLabel={`${need.title} raised`} className="h-1.5 mt-2" barClassName="bg-[#7cc97e]" />
        </div>
        <div className="bg-[#0b0b0b] border border-[#262626] rounded-[8px] px-4 py-[14px]">
          <div className={TILE_LABEL}>ENDS</div>
          <div className={TILE_VALUE}>{formatShortDate(funded.endsOn)}</div>
          <div className="mt-0.5 text-[13px] text-[#bdbdbd]">{`${need.daysLeft} days left`}</div>
        </div>
      </div>
    </div>
  );
}
