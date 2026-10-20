"use client";

import ActivationSummary from "@/components/organization/activations/activation-summary";
import CategoryColumn from "@/components/organization/activations/category-column";
import { CATEGORY_ORDER, CATEGORY_STYLE, VISIBLE_CATEGORIES } from "@/components/organization/activations/data";
import RecommendedCard, { type RecommendedEntry } from "@/components/organization/activations/recommended-card";
import { useActivationInventory } from "@/components/organization/activations/use-activation-inventory";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import type { ActivationCategory } from "@/utils/types/activations";

interface Stat {
  label: string;
  value: string;
  caption: string;
}

function StatCard({ label, value, caption }: Stat) {
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-3 backdrop-blur-[48px] bg-surface-07">
      <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight min-h-[70px]">
        {label}
      </h3>
      <div className="flex flex-col gap-2">
        <div className="h-[60px] rounded-[8px] bg-[rgba(235,235,235,0.25)] backdrop-blur-[48px] flex items-center justify-center">
          <span className="font-display font-black text-[28px] text-white leading-none">{value}</span>
        </div>
        <span className="text-xs text-white/80">{caption}</span>
      </div>
    </div>
  );
}

export default function ActivationsPage() {
  const inv = useActivationInventory();

  const header = (
    <div className="flex flex-col gap-2">
      <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
        Activations
      </h2>
      <p className="text-base text-white/80">Select the fan experience and features you want to offer in your Fan Hub.</p>
    </div>
  );

  const { form, catalog } = inv;
  if (inv.loading || !form || !catalog) {
    return (
      <div className="flex flex-col gap-10">
        {header}
        {inv.loading ? (
          <Loader />
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-base text-white/80">We couldn&apos;t load your activations.</p>
            <Button label="Try again" onClick={inv.reload} />
          </div>
        )}
      </div>
    );
  }

  const categoryInfo = (category: ActivationCategory) => catalog.categories.find((c) => c.category === category);
  const categoryLabels = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, categoryInfo(c)?.label ?? c])
  ) as Record<ActivationCategory, string>;

  const ticked = VISIBLE_CATEGORIES.flatMap((c) => form.columns[c]).filter((s) => s.enabled);

  // Total = ticked slots. Active / Draft / Scheduled / Completed have no source yet (Active was
  // "ticked with a link", and links aren't on this page any more) — shown as "—" until the
  // stat cards get their data.
  const stats: Stat[] = [
    { label: "Total Activations", value: String(ticked.length), caption: "All Time" },
    { label: "Active", value: "—", caption: "of Total" },
    { label: "Draft", value: "—", caption: "of Total" },
    { label: "Scheduled", value: "—", caption: "All Time" },
    { label: "Completed", value: "—", caption: "This Month" },
  ];

  const recommended: RecommendedEntry[] = VISIBLE_CATEGORIES.flatMap((category) =>
    form.columns[category].filter((slot) => slot.isRecommended && !slot.retired).map((slot) => ({ category, slot }))
  );

  return (
    <div className="flex flex-col gap-10">
      {header}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* 4-column row: 3 category cards + right rail */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {VISIBLE_CATEGORIES.map((category) => (
          <CategoryColumn
            key={category}
            label={categoryLabels[category]}
            description={categoryInfo(category)?.description ?? ""}
            color={CATEGORY_STYLE[category].color}
            slots={form.columns[category]}
            rowErrors={inv.rowErrors}
            onValueChange={(rowKey, value) => inv.setValue(category, rowKey, value)}
            onToggle={(rowKey) => inv.toggle(category, rowKey)}
            onSelectAll={() => inv.selectAll(category)}
            onClearAll={() => inv.clearAll(category)}
            onReorder={(from, to) => inv.reorder(category, from, to)}
          />
        ))}

        {/* Right rail */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          <ActivationSummary columns={form.columns} categoryLabels={categoryLabels} />
          <RecommendedCard
            entries={recommended}
            organizationTypeLabel={catalog.organizationTypeLabel}
            onToggle={({ category, slot }) => inv.toggle(category, slot.rowKey)}
            onApply={inv.selectRecommended}
          />
        </div>
      </div>

      {/* Footer action */}
      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border-divider pt-6">
        {inv.dirty && <span className="text-sm text-white/70">You have unsaved changes</span>}
        <Button
          variant="cta"
          label={inv.saving ? "Saving…" : "Save Activations"}
          disabled={inv.saving}
          onClick={inv.save}
        />
      </div>
    </div>
  );
}
