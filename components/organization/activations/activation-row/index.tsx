"use client";

import { DollarSign, Equal } from "lucide-react";
import Checkbox from "@/components/common/checkbox";
import Input from "@/components/common/input";
import { MAX_SIZE_LENGTH } from "@/components/organization/activations/data";
import type { FormSlot } from "@/components/organization/activations/helpers";
import type { SlotField } from "@/components/organization/activations/use-activation-inventory";
import { cn } from "@/utils/cn";

interface DragProps {
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

interface ActivationRowProps {
  slot: FormSlot;
  onToggle: () => void;
  onValueChange: (value: string) => void;
  onSizeChange: (size: string) => void;
  // Problems with this slot's value or size.
  errors?: Partial<Record<SlotField, string>>;
  dragging: boolean;
  drag: DragProps;
}

const PILL = "self-start text-xs text-white bg-[rgba(0,0,0,0.5)] px-2 py-1 rounded-[70px] backdrop-blur-[104px] leading-none";

// One slot in a category column. Pre Game, Live, Post Game and Add-on slots follow their column's
// Select All / Clear All, so they show no checkbox (dimmed while off). Exclusivity slots are ticked
// one by one and take their own value and size, ticked or not.
export default function ActivationRow({ slot, onToggle, onValueChange, onSizeChange, errors, dragging, drag }: ActivationRowProps) {
  const usesDefault = slot.editable && slot.value.trim() === "";
  const showPills = slot.isRecommended || slot.retired || usesDefault;

  const text = (
    <span className="flex flex-col gap-1 min-w-0">
      <span className="text-base font-semibold text-white break-words">{slot.name}</span>
      {slot.description && <span className="text-sm text-white/40 break-words">{slot.description}</span>}
      {showPills && (
        <span className="flex flex-wrap gap-1 mt-1">
          {slot.isRecommended && !slot.retired && <span className={PILL}>Recommended</span>}
          {usesDefault && <span className={PILL}>Default value</span>}
          {slot.retired && <span className={cn(PILL, "bg-error/70")}>No longer offered</span>}
        </span>
      )}
    </span>
  );

  return (
    <div {...drag} className={cn("flex flex-col gap-2 rounded-[8px] transition-opacity", dragging && "opacity-50")}>
      <div className={cn("flex items-start gap-2 transition-opacity", !slot.editable && !slot.enabled && "opacity-50")}>
        {slot.editable ? (
          // A clickable row (checkbox + text), not an action button.
          <button
            type="button"
            role="checkbox"
            aria-checked={slot.enabled}
            onClick={onToggle}
            className="flex items-start gap-3 flex-1 text-left min-w-0"
          >
            <span className="mt-1">
              <Checkbox variant="white" checked={slot.enabled} />
            </span>
            {text}
          </button>
        ) : (
          <div className="flex-1 min-w-0">{text}</div>
        )}
        <span className="cursor-grab active:cursor-grabbing shrink-0">
          <Equal className="w-5 h-5 text-white opacity-60" />
        </span>
      </div>

      {slot.editable ? (
        // Typing or selecting text in the fields must not start dragging the row. Stacked, since
        // the column is narrow with all five in one row.
        <div className="flex flex-col gap-3" draggable onDragStart={(e) => e.preventDefault()}>
          <Input
            variant="dark"
            type="number"
            label="Value (USD)"
            labelClassName="text-xs font-normal text-white/70"
            name={`value-${slot.rowKey}`}
            placeholder="Default"
            icon={<DollarSign className="w-4 h-4" />}
            value={slot.value}
            onChange={(e) => onValueChange(e.target.value)}
            error={errors?.value}
            inputClassName="h-10 text-sm pr-3 pl-10"
          />
          <Input
            variant="dark"
            label="Size"
            labelClassName="text-xs font-normal text-white/70"
            name={`size-${slot.rowKey}`}
            placeholder="e.g. 12 x 12 ft"
            value={slot.size}
            onChange={(e) => onSizeChange(e.target.value)}
            error={errors?.size}
            maxLength={MAX_SIZE_LENGTH}
            inputClassName="h-10 text-sm px-3"
          />
        </div>
      ) : (
        errors?.value && <p className="text-sm text-error">{errors.value}</p>
      )}
    </div>
  );
}
