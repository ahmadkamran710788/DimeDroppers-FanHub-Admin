"use client";

import { useRef, useState } from "react";
import AddExclusivity from "@/components/organization/inventory/add-exclusivity";
import InventoryRow from "@/components/organization/inventory/inventory-row";
import { CATEGORY_STYLE } from "@/components/organization/inventory/data";
import type { FormSlot } from "@/components/organization/inventory/helpers";
import type { RowErrors } from "@/components/organization/inventory/use-inventory";
import Button from "@/components/common/button";
import Toggle from "@/components/common/toggle";
import { cn } from "@/utils/cn";
import type { ActivationCategory } from "@/utils/types/activations";

interface CategoryColumnProps {
  category: ActivationCategory;
  label: string;
  description: string;
  // "stacked" for the narrow top-row cards, "wide" for the two bottom ones.
  layout: "stacked" | "wide";
  slots: FormSlot[];
  rowErrors: RowErrors;
  onToggle: (rowKey: string) => void;
  onValueChange: (rowKey: string, value: string) => void;
  onSizeChange: (rowKey: string, size: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onReorder: (fromKey: string, toKey: string) => void;
  // Exclusivity: the org adds its own slots and can remove them.
  onAdd?: (fields: { name: string; value: string; size: string }) => string | null;
  onRemove?: (rowKey: string) => void;
}

// One category card (Pre Game, Live, Post Game, Add-ons, Exclusivity): a coloured header with its icon
// and selected count, every slot with its switch in a scrolling list (drag to reorder), and Select All /
// Clear All at the foot.
export default function CategoryColumn({
  category,
  label,
  description,
  layout,
  slots,
  rowErrors,
  onToggle,
  onValueChange,
  onSizeChange,
  onSelectAll,
  onClearAll,
  onReorder,
  onAdd,
  onRemove,
}: CategoryColumnProps) {
  const style = CATEGORY_STYLE[category];
  const Icon = style.icon;
  const dragKey = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const selected = slots.filter((s) => s.enabled).length;
  const allSelected = slots.length > 0 && selected === slots.length;

  const endDrag = () => {
    dragKey.current = null;
    setDraggingKey(null);
  };

  return (
    <div className={cn("w-full min-w-0 h-full rounded-[10px] overflow-hidden flex flex-col border border-white/10", style.body)}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-3 py-3", style.header)}>
        <span className={cn("size-12 shrink-0 rounded-[8px] flex items-center justify-center", style.badge)}>
          <Icon className="size-7 text-white" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h3 className="font-display font-black text-[22px] uppercase text-white leading-none">{label}</h3>
          <p className="text-xs text-white/90 leading-4">{description}</p>
        </div>
        <span className="w-[62px] h-[52px] shrink-0 rounded-[8px] bg-[rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-1">
          <span className="font-display font-black text-xl text-white leading-none">{selected}</span>
          <span className="text-[11px] text-white leading-none">Selected</span>
        </span>
      </div>

      {/* Slot list, scrolling inside the card */}
      <div className="flex-1 min-h-0 max-h-[262px] overflow-y-auto pl-4 pr-3 py-4 flex flex-col gap-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_transparent]">
        {slots.length === 0 && (
          <p className="text-sm text-white/60">{onAdd ? "No physical assets yet. Add your own below." : "Nothing available yet."}</p>
        )}
        {slots.map((slot) => (
          <InventoryRow
            key={slot.rowKey}
            slot={slot}
            layout={layout}
            pillClassName={style.pill}
            onToggle={() => onToggle(slot.rowKey)}
            onValueChange={(value) => onValueChange(slot.rowKey, value)}
            onSizeChange={(size) => onSizeChange(slot.rowKey, size)}
            onRemove={onRemove && slot.editable ? () => onRemove(slot.rowKey) : undefined}
            errors={rowErrors[slot.rowKey]}
            dragging={draggingKey === slot.rowKey}
            drag={{
              draggable: true,
              onDragStart: () => {
                dragKey.current = slot.rowKey;
                setDraggingKey(slot.rowKey);
              },
              onDragEnd: endDrag,
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => {
                const from = dragKey.current;
                endDrag();
                if (from) onReorder(from, slot.rowKey);
              },
            }}
          />
        ))}
      </div>

      {onAdd && (
        <div className="mx-4 py-3 border-t border-white/15 flex">
          <AddExclusivity onAdd={onAdd} />
        </div>
      )}

      {/* Select All / Clear All */}
      <div className="mx-4 py-3 border-t border-white/15 flex items-center justify-between gap-2">
        {slots.length > 0 && (
          <Toggle
            size="sm"
            label={`Select All (${slots.length})`}
            labelPosition="right"
            labelClassName="text-sm font-medium"
            checked={allSelected}
            // Switches the rest on, or the whole column off when everything is already on.
            onChange={(on) => (on ? onSelectAll() : onClearAll())}
          />
        )}
        <Button
          variant="text"
          size="sm"
          label="Clear All"
          onClick={onClearAll}
          disabled={selected === 0}
          className="text-sm font-medium text-white hover:text-white/80"
        />
      </div>
    </div>
  );
}
