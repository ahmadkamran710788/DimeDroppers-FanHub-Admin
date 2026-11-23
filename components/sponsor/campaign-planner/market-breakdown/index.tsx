import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import ProgressBar from "@/components/common/progress-bar";
import { dollars } from "@/utils/needs";
import { CARD } from "@/components/sponsor/styles";
import type { PlanMarketSummary } from "@/components/sponsor/campaign-planner/summarize-plan";

// "58.5" / "60": a percent to at most one decimal.
const percent = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

// One card per market (a city with brand locations, or a budget split row): its cost and share of the plan's
// spend. With a split, also what it spent of its row's percent and its target (the bar shows how much of the
// target was spent).
export default function MarketBreakdown({ markets }: { markets: PlanMarketSummary[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
      {markets.map((m) => {
        const split = m.requestedPercent !== null;
        const spentOfTarget = m.targetCents ? (m.totalCents / m.targetCents) * 100 : 0;
        return (
          <article key={m.key} className={cn(CARD, "rounded-[8px] p-5 flex flex-col gap-[10px]")}>
            <div className="flex justify-between items-baseline gap-3">
              <h4 className="min-w-0 break-words font-display font-extrabold text-[30px] uppercase leading-none">
                {m.label}
              </h4>
              <div className="text-lg font-bold">{dollars(m.totalCents)}</div>
            </div>
            <ProgressBar
              percent={split ? spentOfTarget : m.shareOfSpend}
              ariaLabel={split ? `${m.label} share of its target spent` : `${m.label} share of spend`}
              barClassName="bg-[#8b6dff]"
            />
            {split && (
              <div className="text-sm font-semibold text-white">
                {`${percent(m.shareOfBudget)}% of ${m.requestedPercent}% · target ${dollars(m.targetCents)}`}
              </div>
            )}
            <div className="text-sm text-[#bdbdbd]">
              {plural(m.organizationCount, "organization")} · {m.projectedReach.toLocaleString("en-US")} est. reach ·{" "}
              {m.shareOfSpend}% of spend
            </div>
          </article>
        );
      })}
    </div>
  );
}
