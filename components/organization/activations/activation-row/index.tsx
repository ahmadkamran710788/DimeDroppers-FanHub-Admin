"use client";

import { DollarSign, Equal } from "lucide-react";
import Checkbox from "@/components/common/checkbox";
import Input from "@/components/common/input";
import type { FormSlot } from "@/components/organization/activations/helpers";
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
  onValueChange: (value: string) => void;
  onToggle: () => void;
  // A problem with this slot's value.
  error?: string;
  dragging: boolean;
  drag: DragProps;
}

const PILL = "self-start text-xs text-white bg-[rgba(0,0,0,0.5)] px-2 py-1 rounded-[70px] backdrop-blur-[104px] leading-none";

// One slot in a category column: tick it to show it to sponsors; once ticked it takes its value
// in dollars.
export default function ActivationRow({ slot, onValueChange, onToggle, error, dragging, drag }: ActivationRowProps) {
  return (
    <div {...drag} className={cn("flex flex-col gap-2 rounded-[8px] transition-opacity", dragging && "opacity-50")}>
      <div className="flex items-start gap-2">
        {/* A clickable row (checkbox + text), not an action button. */}
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
          <span className="flex flex-col gap-1 min-w-0">
            <span className="text-base font-semibold text-white break-words">{slot.name}</span>
            {slot.description && <span className="text-sm text-white/40 break-words">{slot.description}</span>}
            {(slot.isRecommended || slot.retired) && (
              <span className="flex flex-wrap gap-1 mt-1">
                {slot.isRecommended && !slot.retired && <span className={PILL}>Recommended</span>}
                {slot.retired && <span className={cn(PILL, "bg-error/70")}>No longer offered</span>}
              </span>
            )}
          </span>
        </button>
        <span className="cursor-grab active:cursor-grabbing shrink-0">
          <Equal className="w-5 h-5 text-white opacity-60" />
        </span>
      </div>

      {slot.enabled && (
        // Typing or selecting text in the field must not start dragging the row.
        <div className="ml-7 flex flex-col gap-2" draggable onDragStart={(e) => e.preventDefault()}>
          <Input
            variant="dark"
            type="number"
            label={`${slot.name} value (USD)`}
            labelClassName="sr-only"
            name={`value-${slot.rowKey}`}
            placeholder="0"
            icon={<DollarSign className="w-4 h-4" />}
            value={slot.value}
            onChange={(e) => onValueChange(e.target.value)}
            error={error}
            inputClassName="h-10 text-sm pr-3 pl-10"
          />
        </div>
      )}
    </div>
  );
}
