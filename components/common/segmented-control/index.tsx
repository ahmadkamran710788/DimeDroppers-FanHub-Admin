"use client";

import { cn } from "@/utils/cn";

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (option: T) => void;
  ariaLabel: string;
  className?: string;
}

// Compact pill switch for top-level page sections (e.g. Media | Insights). Visually
// distinct from the underlined Tabs, which filter content inside a section.
export default function SegmentedControl<T extends string>({
  options,
  active,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex self-start p-1 gap-1 rounded-full bg-white/10 backdrop-blur-[24px]", className)}
    >
      {options.map((option) => {
        const isActive = option === active;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option)}
            className={cn(
              "h-9 px-5 rounded-full text-sm font-medium transition-colors",
              isActive ? "text-white" : "text-white/60 hover:text-white"
            )}
            style={isActive ? { background: "var(--gradient-cta)" } : undefined}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
