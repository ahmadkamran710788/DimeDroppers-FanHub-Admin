import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import FilterChips from "@/components/common/filter-chips";
import { dollars } from "@/utils/needs";
import { CARD } from "@/components/sponsor/styles";
import type { SponsorPlanLine, SponsorPlanMarket } from "@/utils/types/sponsor-plan";

// Shared by the header and the rows so the columns line up.
const COLUMNS = "grid grid-cols-[44px_2.2fr_0.9fr_1fr_2fr_1.8fr_0.9fr] gap-[14px] items-center px-[14px]";

// "All" in the market filter (a market key otherwise).
export const ALL_MARKETS = "ALL";

interface PlacementsTableProps {
  lines: SponsorPlanLine[];
  // The plan's markets, for the filter chips.
  markets: SponsorPlanMarket[];
  // ALL_MARKETS or a market key.
  market: string;
  onMarketChange: (market: string) => void;
  // Indexes of the lines dropped from the plan.
  excluded: ReadonlySet<number>;
  onToggle: (index: number) => void;
}

// The plan line by line; unticking a line drops it from the totals (on screen only, nothing is sent).
export default function PlacementsTable({ lines, markets, market, onMarketChange, excluded, onToggle }: PlacementsTableProps) {
  const options = [
    { label: "All", value: ALL_MARKETS },
    ...markets.map((m) => ({ label: m.label, value: m.key })),
  ];
  return (
    <section aria-label="What’s in the package" className={cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-4")}>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">What’s in the package</h3>
        {markets.length > 1 && (
          <FilterChips variant="pill" ariaLabel="Market" options={options} value={market} onChange={onMarketChange} />
        )}
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
            <span>PHYSICAL ADD-ONS</span>
            <span className="text-right">COST</span>
          </div>
          <ul className="flex flex-col gap-2">
            {lines.map((line, index) => {
              if (market !== ALL_MARKETS && line.market.key !== market) return null;
              const on = !excluded.has(index);
              const name = line.event?.name ? `${line.organization.name} · ${line.event.name}` : line.organization.name;
              return (
                <li
                  key={`${line.schoolId}|${line.eventId ?? ""}|${index}`}
                  className={cn(
                    COLUMNS,
                    "py-3 rounded-[12px] border",
                    on ? "bg-[#0b0b0b] border-[#262626]" : "border-dashed border-[#2a2a2a] opacity-55"
                  )}
                >
                  <Button
                    size="icon"
                    icon={<Checkbox variant="violet" checked={on} />}
                    aria-label={`Include ${name}`}
                    aria-pressed={on}
                    onClick={() => onToggle(index)}
                    className="size-11 bg-transparent backdrop-blur-none"
                  />
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold break-words">{name}</div>
                    <div className="text-[13px] text-[#a8a8a8] mt-[2px] leading-[1.4]">{line.reason}</div>
                  </div>
                  <div className="text-sm">{line.market.label}</div>
                  <div>
                    <span className="inline-block text-xs font-bold px-2 py-1 rounded-[6px] bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
                      {line.package?.name ?? "Physical add-ons only"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-[6px]">
                    {line.inAppInventory.length ? (
                      line.inAppInventory.map((item) => (
                        <span key={item} className="text-xs px-2 py-1 rounded-full bg-[#1f1f1f] text-[#e0e0e0]">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px] text-[#757575]">—</span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#d4d4d4] leading-[1.4]">
                    {line.physicalAssets.map((a) => a.name).join(" · ") || "—"}
                  </div>
                  <div className="text-base font-bold text-right">{dollars(line.totalCents)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
