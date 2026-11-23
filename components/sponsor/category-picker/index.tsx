"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import MultiSelect, { ALL, type MultiSelectValue } from "@/components/common/multi-select";
import CategoryBadges from "@/components/sponsor/category-picker/category-badges";
import {
  CUSTOM_CATEGORY_MAX,
  OTHER_CATEGORY,
  categoryLabel,
  categoryOptionsAZ,
  withTypedCategory,
} from "@/components/sponsor/data";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import type { SponsorSignupOptions } from "@/utils/types/sponsor-profile";

interface CategoryPickerProps {
  name: string;
  label: string;
  // The API's categories. Empty while they load: saved picks still show, as their text.
  options: SponsorSignupOptions["categories"];
  // Listed codes and the sponsor's own categories, in the order picked.
  value: string[];
  onChange: (categories: string[]) => void;
  // The Other box's text, not yet added.
  other: string;
  onOther: (text: string) => void;
  error?: string;
  otherError?: string;
  // Shown above the Other box; without it the box is named for screen readers only.
  otherLabel?: string;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  inputClassName?: string;
  // The Add button's height, to match the box.
  addClassName?: string;
}

// A sponsor's categories (sign-up and profile): a dropdown that ticks as many as fit, with Other at the end
// opening a box for categories of their own. Every pick shows as a badge under it, with an × to remove it.
export default function CategoryPicker({
  name,
  label,
  options,
  value,
  onChange,
  other,
  onOther,
  error,
  otherError,
  otherLabel,
  className,
  labelClassName,
  selectClassName,
  inputClassName,
  addClassName,
}: CategoryPickerProps) {
  // Other is ticked: its box shows. Already open when it still holds text (e.g. back from the next step).
  const [otherOpen, setOtherOpen] = useState(() => other.trim() !== "");
  const otherName = `${name}-other`;
  const labelOf = (category: string) => categoryLabel(category, options);
  // The sponsor's own categories are rows too, ticked, so the list unticks them like any other.
  const own = value.filter((v) => !options.some((c) => c.code === v)).map((v) => ({ label: v, value: v }));

  // One row changed: Other opens or closes its box, any other row is picked or unpicked.
  function pick(next: MultiSelectValue) {
    if (next === ALL) return;
    const open = next.includes(OTHER_CATEGORY);
    if (open !== otherOpen) {
      setOtherOpen(open);
      if (!open) onOther("");
      return;
    }
    onChange(next.filter((v) => v !== OTHER_CATEGORY));
  }

  function add() {
    if (!other.trim()) return;
    onChange(withTypedCategory(value, other, options));
    onOther("");
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <MultiSelect
        label={label}
        name={name}
        value={otherOpen ? [...value, OTHER_CATEGORY] : value}
        onChange={pick}
        options={[...categoryOptionsAZ(options), ...own, { label: "Other", value: OTHER_CATEGORY }]}
        // Counts the categories, not the Other row.
        countLabel={() => (value.length === 1 ? labelOf(value[0]) : `${value.length} categories`)}
        placeholder="Choose categories"
        searchPlaceholder="Search categories"
        error={error}
        variant="dark"
        labelClassName={labelClassName}
        selectClassName={selectClassName}
      />
      {!error && value.length === 0 && !otherOpen && (
        <p className="text-sm text-[#a8a8a8]">Pick all that fit. Choose Other to add your own.</p>
      )}

      <CategoryBadges
        categories={value.map((v) => ({ value: v, label: labelOf(v) }))}
        onRemove={(category) => onChange(value.filter((v) => v !== category))}
      />

      {otherOpen && (
        <div className="flex flex-col gap-2">
          {otherLabel && (
            <span aria-hidden className={labelClassName}>
              {otherLabel}
            </span>
          )}
          {/* The box's own label is for screen readers, so Add lines up with the box (its counter sits below). */}
          <div className="flex items-start gap-3">
            <Input
              label="Your category"
              name={otherName}
              value={other}
              onChange={(e) => onOther(e.target.value)}
              // Enter adds it, instead of submitting the form.
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                add();
              }}
              placeholder="Your own, e.g. Pizza restaurant"
              maxLength={CUSTOM_CATEGORY_MAX}
              error={otherError}
              variant="dark"
              className="flex-1 min-w-0"
              labelClassName="sr-only"
              inputClassName={inputClassName}
            />
            <Button
              label="Add"
              onClick={add}
              disabled={!other.trim()}
              className={cn(OUTLINE_BUTTON, "shrink-0 rounded-[10px] px-5 font-semibold", addClassName)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
