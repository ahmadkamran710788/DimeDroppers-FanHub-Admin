"use client";

import InventorySummary from "@/components/organization/inventory/inventory-summary";
import CategoryColumn from "@/components/organization/inventory/category-column";
import TournamentSetup from "@/components/organization/inventory/tournament-setup";
import { CalendarDays, CircleCheck, FileText, Layers, type LucideIcon } from "lucide-react";
import { CATEGORY_ORDER } from "@/components/organization/inventory/data";
import { useInventory } from "@/components/organization/inventory/use-inventory";
import Button from "@/components/common/button";
import { useState } from "react";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent, type SelectedEvent } from "@/context/selected-event";
import type { ActivationCategory } from "@/utils/types/activations";

interface Stat {
  label: string;
  value: string;
  caption: string;
  // A lucide icon in the badge, or "dot" for the green status dot (Active).
  icon: LucideIcon | "dot";
}

// Compact stat: icon badge on the left, then the label, the figure and a caption.
function StatCard({ label, value, caption, icon: Icon }: Stat) {
  return (
    <div className="rounded-[10px] px-4 py-4 flex items-start gap-3 border border-white/10 bg-[rgba(11,20,36,0.7)] backdrop-blur-[48px]">
      <span className="size-11 shrink-0 rounded-[8px] bg-[rgba(255,255,255,0.08)] flex items-center justify-center">
        {Icon === "dot" ? <span className="size-5 rounded-full bg-success" /> : <Icon className="size-6 text-white" strokeWidth={1.5} />}
      </span>
      <div className="flex flex-col gap-1.5 min-w-0">
        <h3 className="font-display font-black text-base uppercase text-white leading-none">{label}</h3>
        <span className="font-display font-black text-[26px] text-white leading-none">{value}</span>
        <span className="text-xs text-white/70">{caption}</span>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { org } = useAuth();
  const kind = orgKindOf(org);
  // A tournament has one inventory per event: the event shared with the other pages' pickers. A
  // school has one inventory (null); until the org type is known nothing loads ("").
  const { event, setEvent } = useSelectedEvent();
  const inventoryEventId = kind === "school" ? null : kind === "tournament" ? (event?.id ?? "") : "";
  const inv = useInventory(inventoryEventId);
  // An event picked while the open one has unsaved changes, waiting for the user to confirm.
  const [pendingEvent, setPendingEvent] = useState<SelectedEvent | null>(null);

  const pickEvent = (id: string, name: string) => {
    if (id === event?.id) return;
    if (inv.dirty) setPendingEvent({ id, name });
    else setEvent({ id, name });
  };

  const setup = kind === "tournament" && (
    <TournamentSetup
      eventId={event?.id ?? ""}
      eventName={event?.name}
      onEventChange={pickEvent}
      refreshKey={inv.saves}
      format={inv.tournament?.format}
      formatOptions={inv.loading ? undefined : inv.tournament?.formatOptions}
      onFormatChange={inv.setFormat}
      missing={inv.missing}
    />
  );

  const switchConfirm = (
    <ConfirmModal
      isOpen={!!pendingEvent}
      onClose={() => setPendingEvent(null)}
      title="Discard unsaved changes?"
      message={`Your changes to this event's inventory aren't saved. Open ${pendingEvent?.name ?? "the other event"} anyway?`}
      confirmLabel="Discard and switch"
      busyLabel="Switching…"
      destructive
      onConfirm={async () => {
        if (pendingEvent) setEvent(pendingEvent);
        return true;
      }}
    />
  );

  const header = (
    <div className="flex flex-col gap-3">
      <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[44px] uppercase text-white leading-none">
        Inventory
      </h2>
      <p className="text-sm text-white/85">
        Choose what sponsors can see in your Fan Hub. Switch each item on or off, and add your own physical assets
        with their name, size and value.
      </p>
    </div>
  );

  const { form, catalog } = inv;
  if (inv.loading || inv.waiting || !form || !catalog) {
    return (
      <div className="flex flex-col gap-10">
        {header}
        {setup}
        {inv.loading || inv.waiting ? (
          <Loader />
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-base text-white/80">We couldn&apos;t load your inventory.</p>
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

  const ticked = CATEGORY_ORDER.flatMap((c) => form.columns[c]).filter((s) => s.enabled);

  // Total = switched-on slots. Active / Draft / Scheduled / Completed have no source yet (Active was
  // "ticked with a link", and links aren't on this page any more) — shown as "—" until the
  // stat cards get their data.
  const stats: Stat[] = [
    { label: "Total Inventory", value: String(ticked.length), caption: "All Time", icon: Layers },
    { label: "Active", value: "—", caption: "of Total", icon: "dot" },
    { label: "Draft", value: "—", caption: "of Total", icon: FileText },
    { label: "Scheduled", value: "—", caption: "All Time", icon: CalendarDays },
    { label: "Completed", value: "—", caption: "This Month", icon: CircleCheck },
  ];

  // Pre Game / Live / Post Game share the top row; Add-ons and Exclusivity the wider bottom one.
  const column = (category: ActivationCategory, layout: "stacked" | "wide") => (
    <CategoryColumn
      key={category}
      category={category}
      layout={layout}
      label={categoryLabels[category]}
      description={categoryInfo(category)?.description ?? ""}
      slots={form.columns[category]}
      rowErrors={inv.rowErrors}
      onToggle={(rowKey) => inv.toggle(category, rowKey)}
      onValueChange={(rowKey, value) => inv.setValue(category, rowKey, value)}
      onSizeChange={(rowKey, size) => inv.setSize(category, rowKey, size)}
      onSelectAll={() => inv.selectAll(category)}
      onClearAll={() => inv.clearAll(category)}
      onReorder={(from, to) => inv.reorder(category, from, to)}
      onAdd={category === "EXCLUSIVITY" ? inv.addExclusivity : undefined}
      onRemove={category === "EXCLUSIVITY" ? inv.removeExclusivity : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {switchConfirm}
      {header}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] 2xl:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
        {/* Stat cards + the five category cards */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* A tournament has the setup card here instead of the stat cards. */}
          {/* A tournament has the setup card here instead of the stat cards. */}
          {setup || (
            <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 items-stretch">
            {(["PRE_GAME", "LIVE", "POST_GAME"] as ActivationCategory[]).map((c) => column(c, "stacked"))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {(["ADD_ON", "EXCLUSIVITY"] as ActivationCategory[]).map((c) => column(c, "wide"))}
          </div>
        </div>

        {/* Summary and the save action */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-0">
          <InventorySummary columns={form.columns} categoryLabels={categoryLabels} />
          <div className="flex flex-col items-end gap-2">
            {inv.dirty && <span className="text-sm text-white/70">You have unsaved changes</span>}
            {inv.missing.length > 0 && (
              <span className="text-sm text-yellow-300 text-right">Pick this event&apos;s format in Tournament Setup to save.</span>
            )}
            <Button
              variant="cta"
              label={inv.saving ? "Saving…" : "Save Inventory"}
              // A tournament can't save until it has picked its events and format.
              disabled={inv.saving || inv.missing.length > 0}
              onClick={inv.save}
              className="w-full sm:w-[170px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
