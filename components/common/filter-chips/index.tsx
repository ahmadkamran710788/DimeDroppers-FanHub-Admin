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
  className?: string;
}

// Row of single-select filter chips (e.g. status filters above a table).
export default function FilterChips<T extends string>({ options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((o) => {
        const isActive = value === o.value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 px-4 rounded-lg outline outline-1 text-sm font-medium transition-colors",
              isActive
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
