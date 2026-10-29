"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  // Greyed out and not clickable (e.g. a limit reached).
  disabled?: boolean;
  // Shown before the label (e.g. a marker on a suggested chip).
  icon?: ReactNode;
}

// One chip on at a time (the default), or any number with `multiple`. The chip type comes from
// `options` only; inferring it from `value` too would mix T with T[] and widen it to string.
type Selection<T extends string> =
  | { multiple?: false; value: NoInfer<T>; onChange: (value: T) => void }
  | { multiple: true; value: readonly NoInfer<T>[]; onChange: (value: T[]) => void };

type FilterChipsProps<T extends string> = Selection<T> & {
  options: readonly FilterChipOption<T>[];
  // "default": the admin's square chips. "pill": the sponsor pages' rounded chips.
  variant?: "default" | "pill";
  // Names the row for screen readers (rendered as a labelled group).
  ariaLabel?: string;
  className?: string;
};

// Row of filter chips (e.g. status filters above a table). With `multiple`, each chip toggles on its
// own and shows a tick while on.
export default function FilterChips<T extends string>(props: FilterChipsProps<T>) {
  const { options, variant = "default", ariaLabel, className } = props;
  const pill = variant === "pill";
  const isActive = (value: T) => (props.multiple ? props.value.includes(value) : props.value === value);

  function pick(value: T) {
    if (!props.multiple) return props.onChange(value);
    props.onChange(props.value.includes(value) ? props.value.filter((v) => v !== value) : [...props.value, value]);
  }

  return (
    <div
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center", pill ? "gap-[10px]" : "gap-2", className)}
    >
      {options.map((o) => {
        const active = isActive(o.value);
        return (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={active}
            disabled={o.disabled}
            onClick={() => pick(o.value)}
            className={cn(
              "disabled:opacity-40 disabled:cursor-not-allowed",
              pill
                ? "h-11 px-4 rounded-full border text-[15px] font-semibold inline-flex items-center gap-1.5"
                : "h-10 px-4 rounded-lg outline outline-1 text-sm font-medium transition-colors",
              pill
                ? active
                  ? "bg-[#2a2148] text-white border-[#8b6dff]"
                  : "bg-[#0b0b0b] text-[#cfcfcf] border-[#333]"
                : active
                  ? "bg-white/20 outline-white/40 text-white"
                  : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            {props.multiple && active && <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />}
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
