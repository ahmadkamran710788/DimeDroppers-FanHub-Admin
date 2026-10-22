import { CATEGORY_ORDER, CATEGORY_STYLE } from "@/components/organization/inventory/data";
import type { InventoryForm } from "@/components/organization/inventory/helpers";
import ActivationDonut from "@/components/organization/setup/activation-donut";
import type { ActivationCategory } from "@/utils/types/activations";

interface InventorySummaryProps {
  columns: InventoryForm["columns"];
  categoryLabels: Record<ActivationCategory, string>;
}

// The summary: switched-on slots per category (donut), live from the form so unsaved changes show.
export default function InventorySummary({ columns, categoryLabels }: InventorySummaryProps) {
  const lines = CATEGORY_ORDER.map((c) => ({
    category: c,
    count: columns[c].filter((s) => s.enabled).length,
    of: columns[c].length,
  }));
  const total = lines.reduce((n, l) => n + l.count, 0);

  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
      <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">Inventory Summary</h3>
      <div className="h-px bg-border-divider" />
      <div className="flex justify-center">
        <ActivationDonut
          segments={lines.map((l) => ({ key: l.category, color: CATEGORY_STYLE[l.category].accent, count: l.count }))}
          total={total}
          filled
        />
      </div>
      <div className="flex flex-col gap-3">
        {lines.map((l) => (
          <div key={l.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: CATEGORY_STYLE[l.category].accent }} />
              <span className="text-base font-semibold text-white truncate">{categoryLabels[l.category]}</span>
            </span>
            <span className="text-sm text-white/70 shrink-0">
              {l.count} of {l.of}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px bg-border-divider" />
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold text-success leading-none">Great mix!</p>
        <p className="text-xs text-white">
          {total > 0 ? "You've built a well-balanced inventory." : "Switch on inventory to build your fan experience."}
        </p>
      </div>
    </div>
  );
}
