"use client";

import { DollarSign, Equal } from "lucide-react";
import Input from "@/components/common/input";
import Toggle from "@/components/common/toggle";
import { MAX_SIZE_LENGTH } from "@/components/organization/inventory/data";
import type { FormSlot } from "@/components/organization/inventory/helpers";
import type { SlotField } from "@/components/organization/inventory/use-inventory";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";

interface DragProps {
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

interface InventoryRowProps {
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

// A read-only "Value $750" / "Size 12 x 12 ft" line.
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2 min-w-0">
      <span className="text-xs text-white/70 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-white break-words">{value}</span>
    </span>
  );
}

// One slot in a category column, switched on (shown to sponsors) with its toggle. Exclusivity slots
// show Dime's value and size; the Custom one takes its own, typed while it's switched on.
export default function InventoryRow({ slot, onToggle, onValueChange, onSizeChange, errors, dragging, drag }: InventoryRowProps) {
  const showPills = slot.isRecommended || slot.retired;

  return (
    <div {...drag} className={cn("flex flex-col gap-2 rounded-[8px] transition-opacity", dragging && "opacity-50")}>
      <div className="flex items-start gap-3">
        <Toggle size="sm" ariaLabel={`Show ${slot.name} to sponsors`} checked={slot.enabled} onChange={onToggle} className="shrink-0" />
        <span className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-base font-semibold text-white break-words">{slot.name}</span>
          {slot.description && <span className="text-sm text-white/40 break-words">{slot.description}</span>}
          {showPills && (
            <span className="flex flex-wrap gap-1 mt-1">
              {slot.isRecommended && !slot.retired && <span className={PILL}>Recommended</span>}
              {slot.retired && <span className={cn(PILL, "bg-error/70")}>No longer offered</span>}
            </span>
          )}
          {slot.exclusive && !slot.editable && (
            <span className="flex flex-col gap-1 mt-1">
              <Detail label="Value" value={formatMoney(slot.savedValue)} />
              {slot.size && <Detail label="Size" value={slot.size} />}
            </span>
          )}
        </span>
        <span className="cursor-grab active:cursor-grabbing shrink-0">
          <Equal className="w-5 h-5 text-white opacity-60" />
        </span>
      </div>

      {slot.editable && slot.enabled ? (
        // Typing or selecting text in the fields must not start dragging the row. Stacked, since
        // the column is narrow with all five in one row.
        <div className="flex flex-col gap-3" draggable onDragStart={(e) => e.preventDefault()}>
          <Input
            variant="dark"
            type="number"
            label="Value (USD)"
            labelClassName="text-xs font-normal text-white/70"
            name={`value-${slot.rowKey}`}
            placeholder="e.g. 500"
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
