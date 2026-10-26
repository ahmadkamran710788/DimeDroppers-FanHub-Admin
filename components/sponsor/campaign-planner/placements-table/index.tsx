import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import FilterChips from "@/components/common/filter-chips";
import TierBadge from "@/components/sponsor/tier-badge";
import { CARD } from "@/components/sponsor/styles";
import { MARKET_FILTER_OPTIONS, type MarketFilter, type Placement } from "@/components/sponsor/campaign-planner/data";

// Shared by the header and the rows so the columns line up.
const COLUMNS = "grid grid-cols-[44px_2.2fr_0.9fr_1fr_2fr_1.8fr_0.9fr] gap-[14px] items-center px-[14px]";

interface PlacementsTableProps {
  // The lines in the selected market.
  placements: Placement[];
  market: MarketFilter;
  onMarketChange: (market: MarketFilter) => void;
  // Ids of the lines dropped from the plan.
  excluded: ReadonlySet<number>;
  onToggle: (id: number) => void;
}

// The plan line by line; unticking a line drops it from the totals.
export default function PlacementsTable({ placements, market, onMarketChange, excluded, onToggle }: PlacementsTableProps) {
  return (
    <section aria-label="What’s in the package" className={cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-4")}>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">What’s in the package</h3>
        <FilterChips variant="pill" ariaLabel="Market" options={MARKET_FILTER_OPTIONS} value={market} onChange={onMarketChange} />
      </div>
      <p className="text-sm text-[#a8a8a8]">Untick a line to drop it from the plan. Totals update as you go.</p>

      {/* The table keeps its columns on narrow screens and scrolls sideways inside the card. */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px] flex flex-col gap-2">
          <div className={cn(COLUMNS, "text-xs font-bold tracking-[1px] text-[#a8a8a8]")}>
            <span />
            <span>ORGANIZATION</span>
            <span>MARKET</span>
            <span>PACKAGE</span>
            <span>IN-APP INVENTORY</span>
            <span>PHYSICAL ASSETS</span>
            <span className="text-right">COST</span>
          </div>
          <ul className="flex flex-col gap-2">
            {placements.map((p) => {
              const on = !excluded.has(p.id);
              return (
                <li
                  key={p.id}
                  className={cn(
                    COLUMNS,
                    "py-3 rounded-[12px] border",
                    on ? "bg-[#0b0b0b] border-[#262626]" : "border-dashed border-[#2a2a2a] opacity-55"
                  )}
                >
                  <Button
                    size="icon"
                    icon={<Checkbox variant="violet" checked={on} />}
                    aria-label={`Include ${p.org}`}
                    aria-pressed={on}
                    onClick={() => onToggle(p.id)}
                    className="size-11 bg-transparent backdrop-blur-none"
                  />
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold">{p.org}</div>
                    <div className="text-[13px] text-[#a8a8a8] mt-[2px]">
                      {p.sport} · {p.reach.toLocaleString("en-US")} est. parents
                    </div>
                  </div>
                  <div className="text-sm">{p.market}</div>
                  <div>
                    <TierBadge tier={p.tier} />
                  </div>
                  <div className="flex flex-wrap gap-[6px]">
                    {p.inventory.map((item) => (
                      <span key={item} className="text-xs px-2 py-1 rounded-full bg-[#1f1f1f] text-[#e0e0e0]">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="text-[13px] text-[#d4d4d4] leading-[1.4]">{p.addOns}</div>
                  <div className="text-base font-bold text-right">{formatMoney(p.cost)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
