"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FilterDropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: readonly FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  // "pill" is the grey filter chip; "accent" is the teal selector (e.g. Upcoming).
  variant?: "pill" | "accent";
  // Picking the active option again clears it (unless the filter always needs a value).
  clearable?: boolean;
  align?: "left" | "right";
  className?: string;
}

// Single-select dropdown filter: a pill trigger with a teal option list beneath it.
export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  icon,
  variant = "pill",
  clearable = true,
  align = "left",
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "cursor-pointer h-11 px-5 rounded-full flex items-center gap-2 text-base font-medium transition-colors whitespace-nowrap",
          variant === "accent"
            ? "bg-teal text-white hover:opacity-90"
            : selected
              ? "bg-teal/30 text-white outline outline-1 outline-teal"
              : "bg-white/10 text-white/80 hover:bg-white/20"
        )}
      >
        {icon}
        {selected?.label ?? label}
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute top-full mt-2 z-30 min-w-full flex flex-col py-2 bg-teal rounded-xl shadow-xl overflow-hidden",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {options.map((o) => {
            const isActive = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(isActive && clearable ? "" : o.value);
                  setOpen(false);
                }}
                className={cn(
                  "cursor-pointer px-5 py-2.5 text-left text-base font-semibold text-white whitespace-nowrap transition-colors",
                  isActive ? "bg-white/15" : "hover:bg-white/10"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
