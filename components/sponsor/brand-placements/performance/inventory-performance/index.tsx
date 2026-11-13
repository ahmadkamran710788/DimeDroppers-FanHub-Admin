import { cn } from "@/utils/cn";
import FilterChips from "@/components/common/filter-chips";
import { CARD, SECTION_TITLE } from "@/components/sponsor/styles";
import { CATEGORY_TEXT } from "@/components/sponsor/brand-placements/purchased-inventory/data";
import PerfOrgRow from "@/components/sponsor/brand-placements/performance/inventory-performance/perf-org-row";
import SlotPanel from "@/components/sponsor/brand-placements/performance/inventory-performance/slot-panel";
import WeeklyChart from "@/components/sponsor/brand-placements/performance/weekly-chart";
import type { usePerformance } from "@/components/sponsor/brand-placements/performance/use-performance";

interface InventoryPerformanceProps {
  perf: ReturnType<typeof usePerformance>;
  onEditSetup: () => void;
}

// One inventory at a time: how it did at each organization, the selected slot and its weekly chart.
export default function InventoryPerformance({ perf, onEditSetup }: InventoryPerformanceProps) {
  const options = perf.inventories.map((i) => ({
    value: i.id,
    label: i.name,
    icon: <span className={cn("text-[10px] font-bold tracking-[0.5px]", CATEGORY_TEXT[i.category])}>{i.phase}</span>,
    badge: String(i.orgs.length),
  }));

  return (
    <section aria-labelledby="inventory-performance-title" className="flex flex-col gap-[14px]">
      <div className="flex flex-col gap-1">
        <h3 id="inventory-performance-title" className={SECTION_TITLE}>
          Performance by Inventory
        </h3>
        <span className="text-[13px] text-[#a8a8a8]">Pick an inventory to compare how it did at each organization.</span>
      </div>
      <FilterChips variant="pill" ariaLabel="Inventory" options={options} value={perf.inventory.id} onChange={perf.pickInventory} />

      <div className={cn(CARD, "rounded-[12px] px-[18px] py-[14px] flex flex-wrap gap-[10px]")}>
        {perf.inventorySummary.map((s) => (
          <span key={s.label} className="flex-[1_1_160px] flex flex-col gap-0.5">
            <span className="text-xs text-[#a8a8a8]">{s.label}</span>
            <span className="font-display font-black text-[22px]">{s.value}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        <div role="list" aria-label="Organizations with this inventory" className="flex-[3_1_520px] min-w-0 flex flex-col gap-[10px]">
          {perf.orgRows.map((r) => (
            <div role="listitem" key={r.key}>
              <PerfOrgRow
                org={r.org}
                template={r.template}
                nowLabel={r.nowLabel}
                cells={r.cells}
                past={r.past}
                share={r.share}
                inventoryName={perf.inventory.name}
                selected={r.selected}
                onSelect={() => perf.pickSlot(r.key)}
              />
            </div>
          ))}
        </div>
        <SlotPanel detail={perf.detail} rangeLabel={perf.rangeLabel} onEditSetup={onEditSetup} />
      </div>

      <WeeklyChart chart={perf.detail.chart} />
    </section>
  );
}
