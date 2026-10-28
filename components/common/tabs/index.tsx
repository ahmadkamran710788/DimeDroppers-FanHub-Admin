"use client";

import { cn } from "@/utils/cn";

interface TabsProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  // Optional count shown beside each tab label.
  counts?: Partial<Record<T, number>>;
  // Optional pill beside a tab label (e.g. "NATIONAL").
  badges?: Partial<Record<T, string>>;
  className?: string;
}

// Underlined tab bar with the gradient active indicator (same look as the Schedule tabs).
export default function Tabs<T extends string>({ tabs, active, onChange, counts, badges, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex items-end gap-2 border-b border-white/20", className)}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        const count = counts?.[tab];
        const badge = badges?.[tab];
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
            {badge && (
              <span className="text-[11px] font-bold tracking-[1px] leading-normal px-[7px] py-[3px] rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
                {badge}
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
