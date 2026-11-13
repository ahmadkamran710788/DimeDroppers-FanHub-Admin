import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import Button from "@/components/common/button";
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
  // Indexes of the lines removed from the plan.
  excluded: ReadonlySet<number>;
  onRemove: (index: number) => void;
  // Puts every removed line back.
  onRestore: () => void;
}

// The plan line by line; a line's ✕ removes it from the list and the totals (on screen only, nothing is sent).
export default function PlacementsTable({
  lines,
  markets,
  market,
  onMarketChange,
  excluded,
  onRemove,
  onRestore,
}: PlacementsTableProps) {
  const options = [
    { label: "All", value: ALL_MARKETS },
    ...markets.map((m) => ({ label: m.label, value: m.key })),
  ];
  // The lines still in the plan, in the chosen market, keeping their index in the plan.
  const shown = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => !excluded.has(index) && (market === ALL_MARKETS || line.market.key === market));
  const restore = excluded.size > 0 && (
    <Button
      variant="text"
      label={`Restore ${plural(excluded.size, "removed line")}`}
      onClick={onRestore}
      className="text-sm font-semibold text-[#c9b8ff] hover:text-white"
    />
  );
  return (
    <section aria-label="What’s in the package" className={cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-4")}>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">What’s in the package</h3>
        {markets.length > 1 && (
          <FilterChips variant="pill" ariaLabel="Market" options={options} value={market} onChange={onMarketChange} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
        <p className="text-sm text-[#a8a8a8]">Press ✕ to remove a line from the plan. Totals update as you go.</p>
        {restore}
      </div>

      {shown.length === 0 ? (
        <p className="text-[15px] text-[#d4d4d4] py-6 text-center">
          {market === ALL_MARKETS ? "Every line was removed from the plan." : "Every line in this market was removed."}
        </p>
      ) : (
        // The table keeps its columns on narrow screens and scrolls sideways inside the card.
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
              {shown.map(({ line, index }) => {
                const name = line.event?.name ? `${line.organization.name} · ${line.event.name}` : line.organization.name;
                return (
                  <li
                    key={`${line.schoolId}|${line.eventId ?? ""}|${index}`}
                    className={cn(COLUMNS, "py-3 rounded-[12px] border bg-[#0b0b0b] border-[#262626]")}
                  >
                    <Button
                      size="icon"
                      icon={<X className="size-4" strokeWidth={2} />}
                      aria-label={`Remove ${name} from the plan`}
                      title="Remove from the plan"
                      onClick={() => onRemove(index)}
                      className="size-11 rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#d4d4d4] hover:text-white hover:border-[#5a5a5a]"
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
      )}
    </section>
  );
}
