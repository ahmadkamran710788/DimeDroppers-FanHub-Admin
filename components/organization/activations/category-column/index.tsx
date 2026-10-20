"use client";

import { useRef, useState } from "react";
import ActivationRow from "@/components/organization/activations/activation-row";
import { formatUsd, selectedValue, type FormSlot } from "@/components/organization/activations/helpers";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";

interface CategoryColumnProps {
  label: string;
  description: string;
  // Card background tint.
  color: string;
  slots: FormSlot[];
  rowErrors: Record<string, string>;
  onValueChange: (rowKey: string, value: string) => void;
  onToggle: (rowKey: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onReorder: (fromKey: string, toKey: string) => void;
}

// One category (Fan Zone, Community, Play): every slot with its checkbox and value, with
// Select All / Clear All and drag to reorder.
export default function CategoryColumn({
  label,
  description,
  color,
  slots,
  rowErrors,
  onValueChange,
  onToggle,
  onSelectAll,
  onClearAll,
  onReorder,
}: CategoryColumnProps) {
  const dragKey = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const selected = slots.filter((s) => s.enabled).length;
  const allSelected = slots.length > 0 && selected === slots.length;

  const endDrag = () => {
    dragKey.current = null;
    setDraggingKey(null);
  };

  return (
    <div
      className="w-full lg:flex-1 min-w-0 rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
      style={{ background: color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">{label}</h3>
          <p className="text-xs text-white">{description}</p>
        </div>
        <span className="w-16 h-16 rounded-[8px] bg-[rgba(0,0,0,0.4)] flex flex-col items-center justify-center shrink-0">
          <span className="font-display font-black text-[28px] text-white leading-none">{selected}</span>
          <span className="text-xs text-white leading-none">Selected</span>
        </span>
      </div>

      <div className="h-px bg-border-divider" />

      {/* Select All / Clear All */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="text"
          size="sm"
          label={`Select All (${slots.length})`}
          icon={<Checkbox variant="white" checked={allSelected} indeterminate={!allSelected && selected > 0} />}
          // A toggle: ticks the rest, or unticks the column when everything is already ticked.
          onClick={allSelected ? onClearAll : onSelectAll}
          disabled={slots.length === 0}
          className="text-base font-normal text-white hover:text-white"
        />
        <Button
          variant="text"
          size="sm"
          label="Clear All"
          onClick={onClearAll}
          disabled={selected === 0}
          className="text-base font-medium text-white hover:text-white/80"
        />
      </div>

      <div className="h-px bg-border-divider" />

      {/* Slot list */}
      <div className="flex flex-col gap-6">
        {slots.length === 0 && <p className="text-sm text-white/60">No activations available yet.</p>}
        {slots.map((slot) => (
          <ActivationRow
            key={slot.rowKey}
            slot={slot}
            onValueChange={(value) => onValueChange(slot.rowKey, value)}
            onToggle={() => onToggle(slot.rowKey)}
            error={rowErrors[slot.rowKey]}
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

      <div className="h-px bg-border-divider" />

      {/* Footer count */}
      <p className="text-base text-white text-center">
        {selected} of {slots.length} selected · {formatUsd(selectedValue(slots))}
      </p>
    </div>
  );
}
