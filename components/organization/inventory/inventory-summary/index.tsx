import { Check } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import { CATEGORY_ORDER, CATEGORY_STYLE } from "@/components/organization/inventory/data";
import type { InventoryForm } from "@/components/organization/inventory/helpers";
import ActivationDonut from "@/components/organization/setup/activation-donut";
import type { ActivationCategory } from "@/utils/types/activations";

interface InventorySummaryProps {
  columns: InventoryForm["columns"];
  categoryLabels: Record<ActivationCategory, string>;
}

// The page only covers all time (there is no dated inventory history yet).
const PERIODS = [{ label: "All Time", value: "all" }];

// The summary: switched-on slots per category (donut + legend with each share), live from the form so
// unsaved changes show.
export default function InventorySummary({ columns, categoryLabels }: InventorySummaryProps) {
  const lines = CATEGORY_ORDER.map((c) => ({
    category: c,
    count: columns[c].filter((s) => s.enabled).length,
  }));
  const total = lines.reduce((n, l) => n + l.count, 0);
  const share = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="rounded-[10px] p-5 flex flex-col gap-6 border border-white/10 bg-[rgba(11,20,36,0.7)] backdrop-blur-[48px]">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
        <h3 className="font-display font-black text-xl uppercase text-white leading-none whitespace-nowrap">Inventory Summary</h3>
        <FilterDropdown label="All Time" options={PERIODS} value="" onChange={() => {}} clearable={false} align="right" />
      </div>

      <div className="flex justify-center">
        <ActivationDonut
          segments={lines.map((l) => ({ key: l.category, color: CATEGORY_STYLE[l.category].accent, count: l.count }))}
          total={total}
          size={248}
          stroke={34}
          caption="Total Inventory"
          darkCenter
        />
      </div>

      <div className="flex flex-col gap-4 pb-5 border-b border-white/10">
        {lines.map((l) => (
          <div key={l.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 min-w-0">
              <span className="size-5 rounded-full shrink-0" style={{ background: CATEGORY_STYLE[l.category].accent }} />
              <span className="text-sm font-semibold text-white truncate">{categoryLabels[l.category]}</span>
            </span>
            <span className="text-sm text-white shrink-0">{`${l.count} (${share(l.count)}%)`}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[10px] p-5 flex items-center gap-4 bg-[rgba(255,255,255,0.05)] border border-white/10">
        <span className="size-11 shrink-0 rounded-full bg-success flex items-center justify-center">
          <Check className="size-6 text-white" strokeWidth={3} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold text-success leading-none">{total > 0 ? "Great mix!" : "Get started"}</p>
          <p className="text-sm text-white/85 leading-5">
            {total > 0
              ? "You've built a well-balanced inventory with strong fan engagement coverage."
              : "Switch on inventory to build your fan experience."}
          </p>
        </div>
      </div>
    </div>
  );
}
