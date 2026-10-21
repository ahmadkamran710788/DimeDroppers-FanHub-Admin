import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import ProgressBar from "@/components/common/progress-bar";
import { CARD } from "@/components/sponsor/styles";
import type { MarketSummary } from "@/components/sponsor/campaign-planner/summarize-plan";

// One card per market: its cost and share of the plan's spend.
export default function MarketBreakdown({ markets }: { markets: MarketSummary[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
      {markets.map((m) => (
        <article key={m.name} className={cn(CARD, "rounded-[8px] p-5 flex flex-col gap-[10px]")}>
          <div className="flex justify-between items-baseline gap-3">
            <h4 className="font-display font-extrabold text-[30px] uppercase leading-none">{m.name}</h4>
            <div className="text-lg font-bold">{formatMoney(m.cost)}</div>
          </div>
          <ProgressBar percent={m.share} ariaLabel={`${m.name} share of spend`} barClassName="bg-[#8b6dff]" />
          <div className="text-sm text-[#bdbdbd]">
            {m.count} organizations · {m.reach.toLocaleString("en-US")} est. parents · {m.share}% of spend
          </div>
        </article>
      ))}
    </div>
  );
}
