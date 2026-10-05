"use client";

import { cn } from "@/utils/cn";

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (option: T) => void;
  ariaLabel: string;
  // "gradient" (default): CTA-gradient active pill. "light": white active pill with dark text.
  variant?: "gradient" | "light";
  // Stretch to the container with equal-width segments.
  fullWidth?: boolean;
  // "lg": taller segments with larger, semibold labels (e.g. primary content switches).
  size?: "md" | "lg";
  className?: string;
}

// Pill switch for sections or sub-views. Visually distinct from the underlined Tabs.
export default function SegmentedControl<T extends string>({
  options,
  active,
  onChange,
  ariaLabel,
  variant = "gradient",
  fullWidth = false,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const light = variant === "light";
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "p-1 gap-1 rounded-full backdrop-blur-[24px]",
        fullWidth ? "flex w-full" : "inline-flex self-start",
        light ? "bg-white/5" : "bg-white/10",
        className
      )}
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
              "rounded-full font-medium transition-colors whitespace-nowrap",
              size === "lg" ? "h-12 px-6 text-lg font-semibold" : light ? "h-11 px-6 text-base" : "h-9 px-5 text-sm",
              fullWidth && "flex-1",
              isActive
                ? light
                  ? "bg-white text-midnight-navy font-semibold"
                  : "text-white"
                : "text-white/80 hover:text-white"
            )}
            style={isActive && !light ? { background: "var(--gradient-cta)" } : undefined}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
