"use client";

import { cn } from "@/utils/cn";

interface TabsProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  // Optional count shown beside each tab label.
  counts?: Partial<Record<T, number>>;
  className?: string;
}

// Underlined tab bar with the gradient active indicator (same look as the Schedule tabs).
export default function Tabs<T extends string>({ tabs, active, onChange, counts, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex items-end gap-2 border-b border-white/20", className)}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        const count = counts?.[tab];
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              "relative px-4 pb-3 flex items-center gap-2 text-base font-medium transition-colors",
              isActive ? "text-white" : "text-white/60 hover:text-white"
            )}
          >
            {tab}
            {count !== undefined && (
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-white/15 text-xs font-semibold flex items-center justify-center">
                {count}
              </span>
            )}
            {isActive && (
              <span
                className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                style={{ background: "var(--gradient-cta)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
