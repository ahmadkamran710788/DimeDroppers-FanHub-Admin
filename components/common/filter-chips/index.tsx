"use client";

import { cn } from "@/utils/cn";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // "default": the admin's square chips. "pill": the sponsor pages' rounded chips.
  variant?: "default" | "pill";
  // Names the row for screen readers (rendered as a labelled group).
  ariaLabel?: string;
  className?: string;
}

// Row of single-select filter chips (e.g. status filters above a table).
export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  variant = "default",
  ariaLabel,
  className,
}: FilterChipsProps<T>) {
  const pill = variant === "pill";
  return (
    <div
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center", pill ? "gap-[10px]" : "gap-2", className)}
    >
      {options.map((o) => {
        const isActive = value === o.value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(o.value)}
            className={cn(
              pill
                ? "h-11 px-4 rounded-full border text-[15px] font-semibold"
                : "h-10 px-4 rounded-lg outline outline-1 text-sm font-medium transition-colors",
              pill
                ? isActive
                  ? "bg-[#2a2148] text-white border-[#8b6dff]"
                  : "bg-[#0b0b0b] text-[#cfcfcf] border-[#333]"
                : isActive
                  ? "bg-white/20 outline-white/40 text-white"
                  : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
