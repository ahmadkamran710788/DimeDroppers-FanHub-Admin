"use client";

import { useState } from "react";
import { DollarSign, Plus } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { MAX_NAME_LENGTH, MAX_SIZE_LENGTH } from "@/components/organization/inventory/data";
import type { NewAssetFields } from "@/components/organization/inventory/helpers";
import { exclusivitySchema } from "@/components/organization/inventory/schema";
import { validateAndSetErrors } from "@/utils/validation";
import type { OptionView } from "@/utils/types/activations";

type Field = keyof NewAssetFields;
const EMPTY: NewAssetFields = { name: "", value: "", size: "", assetCategory: "" };

interface AddExclusivityProps {
  // The physical asset categories, in the API's order.
  categories: OptionView[];
  // Adds it to the column; returns why it can't be added (e.g. a duplicate name), or null.
  onAdd: (fields: NewAssetFields) => string | null;
}

// The Exclusivity card's foot: an Add button that opens a name / category / value / size form. The new
// exclusivity is switched on and saved with Save Inventory.
export default function AddExclusivity({ categories, onAdd }: AddExclusivityProps) {
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

  if (!open) {
    return (
      <Button
        variant="text"
        size="sm"
        label="Add Physical Asset"
        icon={<Plus className="size-4" />}
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-white hover:text-white/80"
      />
    );
  }

  const labelClassName = "text-xs font-normal text-white/70";
  return (
    <div className="w-full flex flex-col gap-3">
      <Input
        variant="dark"
        label="Name"
        labelClassName={labelClassName}
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
        labelClassName={labelClassName}
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
          labelClassName={labelClassName}
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
          labelClassName={labelClassName}
          name="exclusivity-size"
          placeholder="e.g. 6 x 12 ft"
          value={fields.size}
          onChange={(e) => set("size", e.target.value)}
          error={errors.size}
          maxLength={MAX_SIZE_LENGTH}
          inputClassName="h-10 text-sm px-3"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" label="Cancel" onClick={close} />
        <Button variant="cta" size="sm" label="Add" onClick={add} />
      </div>
    </div>
  );
}
