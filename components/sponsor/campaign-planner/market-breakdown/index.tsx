import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import ProgressBar from "@/components/common/progress-bar";
import { dollars } from "@/utils/needs";
import { CARD } from "@/components/sponsor/styles";
import type { PlanMarketSummary } from "@/components/sponsor/campaign-planner/summarize-plan";

// One card per market (a city with brand locations): its cost and share of the plan's spend.
export default function MarketBreakdown({ markets }: { markets: PlanMarketSummary[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
      {markets.map((m) => (
        <article key={m.key} className={cn(CARD, "rounded-[8px] p-5 flex flex-col gap-[10px]")}>
          <div className="flex justify-between items-baseline gap-3">
            <h4 className="min-w-0 break-words font-display font-extrabold text-[30px] uppercase leading-none">{m.label}</h4>
            <div className="text-lg font-bold">{dollars(m.totalCents)}</div>
          </div>
          <ProgressBar percent={m.shareOfSpend} ariaLabel={`${m.label} share of spend`} barClassName="bg-[#8b6dff]" />
          <div className="text-sm text-[#bdbdbd]">
            {plural(m.organizationCount, "organization")} · {m.fanReach.toLocaleString("en-US")} est. fans ·{" "}
            {m.shareOfSpend}% of spend
          </div>
        </article>
      ))}
    </div>
  );
}
