"use client";

import { DollarSign, Menu, Trash2 } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Toggle from "@/components/common/toggle";
import { MAX_SIZE_LENGTH } from "@/components/organization/inventory/data";
import type { FormSlot } from "@/components/organization/inventory/helpers";
import type { SlotField } from "@/components/organization/inventory/use-inventory";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import type { OptionView } from "@/utils/types/activations";

interface DragProps {
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

interface InventoryRowProps {
  slot: FormSlot;
  // "stacked": the pill sits under the text (narrow cards); "wide": pill / value and size on the right.
  layout: "stacked" | "wide";
  // Background of the "Recommended" pill, by category.
  pillClassName: string;
  onToggle: () => void;
  onValueChange: (value: string) => void;
  onSizeChange: (size: string) => void;
  // The physical asset categories (labels for the read-only row, options while editing).
  assetCategories: OptionView[];
  onAssetCategoryChange?: (code: string) => void;
  // An exclusivity the org added: removed with the next save.
  onRemove?: () => void;
  // Problems with this slot's value, size or category.
  errors?: Partial<Record<SlotField, string>>;
  dragging: boolean;
  drag: DragProps;
}

const PILL = "shrink-0 self-start text-[11px] leading-none text-white px-2.5 py-1 rounded-full whitespace-nowrap";

// A read-only "Value $5" / "Size 3 x 6 ft" pair.
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-[11px] text-white/60">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </span>
  );
}

// One slot in a category card: switch (shown to sponsors or not), name and description, its pills or
// Dime's value and size, and a drag handle. An exclusivity the org added takes its own category, value and
// size (set while it's switched on) and can be removed.
export default function InventoryRow({
  slot,
  layout,
  pillClassName,
  onToggle,
  onValueChange,
  onSizeChange,
  assetCategories,
  onAssetCategoryChange,
  onRemove,
  errors,
  dragging,
  drag,
}: InventoryRowProps) {
  const categoryLabel = assetCategories.find((c) => c.code === slot.assetCategory)?.label;
  const pills = (
    <>
      {slot.isRecommended && !slot.retired && <span className={cn(PILL, pillClassName)}>Recommended</span>}
      {slot.retired && <span className={cn(PILL, "bg-error/70")}>No longer offered</span>}
    </>
  );
  const hasPills = slot.isRecommended || slot.retired;
  // Exclusivity rows show the value (and size) on the right; the Custom Banner swaps it for its inputs
  // while it's switched on.
  const showValue = slot.exclusive && !(slot.editable && slot.enabled);

  return (
    <div {...drag} className={cn("flex flex-col gap-3 transition-opacity", dragging && "opacity-50")}>
      <div className="flex items-start gap-4">
        <Toggle size="sm" ariaLabel={`Show ${slot.name} to sponsors`} checked={slot.enabled} onChange={onToggle} className="shrink-0 mt-0.5" />
        <span className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-sm font-semibold text-white leading-5 break-words">{slot.name}</span>
          {slot.description && <span className="text-xs text-white/70 leading-4 break-words">{slot.description}</span>}
          {layout === "stacked" && hasPills && <span className="flex flex-wrap gap-1 mt-1">{pills}</span>}
        </span>
        {layout === "wide" && hasPills && <span className="flex gap-1 mt-0.5">{pills}</span>}
        {showValue && (
          <span className="shrink-0 flex flex-wrap justify-end items-baseline gap-x-4 gap-y-1 mt-0.5">
            {categoryLabel && <Detail label="Category" value={categoryLabel} />}
            <Detail label="Value" value={formatMoney(slot.savedValue)} />
            {slot.size && <Detail label="Size" value={slot.size} />}
          </span>
        )}
        {onRemove && (
          <Button
            size="icon"
            icon={<Trash2 className="size-4" strokeWidth={1.75} />}
            aria-label={`Remove ${slot.name}`}
            title="Remove"
            onClick={onRemove}
            className="size-7 shrink-0 bg-transparent hover:bg-white/10 text-white/80"
          />
        )}
        <span className="cursor-grab active:cursor-grabbing shrink-0 mt-0.5" aria-hidden>
          <Menu className="w-5 h-5 text-white/70" strokeWidth={1.5} />
        </span>
      </div>

      {slot.editable && slot.enabled ? (
        // Typing or selecting text in the fields must not start dragging the row.
        <div className="pl-14 grid grid-cols-1 sm:grid-cols-2 gap-3" draggable onDragStart={(e) => e.preventDefault()}>
          {/* An asset made before categories starts empty: the org is asked to pick one (saving without it is
              still allowed for those). */}
          <Select
            variant="dark"
            label="Category"
            labelClassName="text-xs font-normal text-white/70"
            name={`category-${slot.rowKey}`}
            value={slot.assetCategory}
            onChange={(e) => onAssetCategoryChange?.(e.target.value)}
            options={assetCategories.map((c) => ({ label: c.label, value: c.code }))}
            placeholder="Choose a category"
            error={errors?.assetCategory}
            className="sm:col-span-2"
            selectClassName="h-10 text-sm px-3"
          />
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
        (errors?.value || errors?.assetCategory) && (
          <p className="pl-14 text-sm text-error">{errors.value ?? errors.assetCategory}</p>
        )
      )}
    </div>
  );
}
