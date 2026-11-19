"use client";

import { useState } from "react";
import { DollarSign, Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { MAX_NAME_LENGTH, MAX_SIZE_LENGTH } from "@/components/organization/inventory/data";
import type { NewAssetFields } from "@/components/organization/inventory/helpers";
import { exclusivitySchema } from "@/components/organization/inventory/schema";
import { validateAndSetErrors } from "@/utils/validation";
import type { OptionView } from "@/utils/types/activations";

type Field = keyof NewAssetFields;
// Sponsor spots start at 1 (one sponsor can buy it), as the API's existing assets do.
const EMPTY: NewAssetFields = { name: "", value: "", size: "", assetCategory: "", maxSponsors: "1" };
const LABEL = "text-xs font-normal text-white/70";

interface AddExclusivityProps {
  // The physical asset categories, in the API's order.
  categories: OptionView[];
  // Adds it to the column; returns why it can't be added (e.g. a duplicate name), or null.
  onAdd: (fields: NewAssetFields) => string | null;
  // The card's own tint, so the form looks like part of it.
  panelClassName?: string;
}

// The Exclusivity card's foot: an Add button that opens the name / category / value / size / Sponsor spots form
// as an overlay over the whole card (the card has to be `relative`). The card keeps its height, so the cards
// beside it don't stretch, and the form's title and Cancel / Add stay in view. The new exclusivity is switched
// on and saved with Save Inventory.
export default function AddExclusivity({ categories, onAdd, panelClassName }: AddExclusivityProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: Field, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const close = () => {
    setOpen(false);
    setFields(EMPTY);
    setErrors({});
  };

  const add = async () => {
    if (!(await validateAndSetErrors(exclusivitySchema, fields, setErrors))) return;
    const problem = onAdd(fields);
    if (problem) {
      setErrors({ name: problem });
      return;
    }
    close();
  };

  return (
    <>
      <Button
        variant="text"
        size="sm"
        label="Add Physical Asset"
        icon={<Plus className="size-4" />}
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-white hover:text-white/80"
      />

      {open && (
        // A solid base under the card's see-through tint, so the list doesn't show through.
        <div
          role="dialog"
          aria-labelledby="add-physical-asset-title"
          // Escape closes it, unless a field inside used it (the Category list closing).
          onKeyDown={(e) => e.key === "Escape" && !e.defaultPrevented && close()}
          className="absolute inset-0 z-10 bg-[#150a0f]"
        >
          <div className={cn("h-full flex flex-col", panelClassName)}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/15">
              <h4 id="add-physical-asset-title" className="font-display font-black text-lg uppercase text-white leading-none">
                Add physical asset
              </h4>
              <Button
                size="icon"
                icon={<X className="size-4" />}
                aria-label="Close"
                onClick={close}
                className="size-8 bg-transparent hover:bg-white/10 text-white/80"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_transparent]">
              <Input
                variant="dark"
                label="Name"
                labelClassName={LABEL}
                name="exclusivity-name"
                placeholder="e.g. Court Side Banner"
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                maxLength={MAX_NAME_LENGTH}
                inputClassName="h-10 text-sm px-3"
              />
              <Select
                variant="dark"
                label="Category"
                labelClassName={LABEL}
                name="exclusivity-category"
                value={fields.assetCategory}
                onChange={(e) => set("assetCategory", e.target.value)}
                options={categories.map((c) => ({ label: c.label, value: c.code }))}
                placeholder="Choose a category"
                error={errors.assetCategory}
                selectClassName="h-10 text-sm px-3"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  variant="dark"
                  type="number"
                  label="Value (USD)"
                  labelClassName={LABEL}
                  name="exclusivity-value"
                  placeholder="e.g. 500"
                  icon={<DollarSign className="w-4 h-4" />}
                  value={fields.value}
                  onChange={(e) => set("value", e.target.value)}
                  error={errors.value}
                  inputClassName="h-10 text-sm pr-3 pl-10"
                />
                <Input
                  variant="dark"
                  label="Size"
                  labelClassName={LABEL}
                  name="exclusivity-size"
                  placeholder="e.g. 6 x 12 ft"
                  value={fields.size}
                  onChange={(e) => set("size", e.target.value)}
                  error={errors.size}
                  maxLength={MAX_SIZE_LENGTH}
                  inputClassName="h-10 text-sm px-3"
                />
              </div>
              <Input
                variant="dark"
                type="number"
                inputMode="numeric"
                label="Sponsor spots"
                labelClassName={LABEL}
                name="exclusivity-spots"
                placeholder="e.g. 3"
                value={fields.maxSponsors}
                onChange={(e) => set("maxSponsors", e.target.value)}
                error={errors.maxSponsors}
                hint="How many sponsors can buy this asset"
                hintClassName="text-white/60"
                className="sm:max-w-[calc(50%-6px)]"
                inputClassName="h-10 text-sm px-3"
              />
            </div>

            <div className="px-4 py-3 border-t border-white/15 flex justify-end gap-2">
              <Button variant="secondary" size="sm" label="Cancel" onClick={close} />
              <Button variant="cta" size="sm" label="Add" onClick={add} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
