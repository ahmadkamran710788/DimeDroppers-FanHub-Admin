"use client";

import { cn } from "@/utils/cn";

interface ToggleProps {
  // Left out for a bare switch (e.g. one per list row); give it an ariaLabel instead.
  label?: string;
  ariaLabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Whether the label sits before or after the switch. Defaults to "left". */
  labelPosition?: "left" | "right";
  // Overrides the label text style (e.g. a small muted description).
  labelClassName?: string;
  // "sm" for tight spots such as list rows. Defaults to "md".
  size?: "sm" | "md";
  className?: string;
}

// Track, knob and the knob's off / on position per size. The knob slides with a transform, not `left`, so
// switching doesn't re-lay out the page on every frame of the slide (Inventory has dozens of switches).
const SIZES = {
  md: { track: "w-[52px] h-[30px]", knob: "top-[3px] left-[3px] w-6 h-6", off: "translate-x-0", on: "translate-x-[22px]" },
  sm: { track: "w-10 h-6", knob: "top-[3px] left-[3px] w-[18px] h-[18px]", off: "translate-x-0", on: "translate-x-4" },
};

export default function Toggle({
  label,
  ariaLabel,
  checked,
  onChange,
  labelPosition = "left",
  labelClassName,
  size = "md",
  className,
}: ToggleProps) {
  const s = SIZES[size];
  const labelEl = label && <span className={cn("text-base font-medium text-white", labelClassName)}>{label}</span>;
  return (
    <label
      className={cn("flex items-center gap-3 cursor-pointer select-none", className)}
    >
      {labelPosition === "left" && labelEl}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : ariaLabel}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative block shrink-0 rounded-full transition-colors duration-200",
          s.track,
          checked ? "bg-[#34C759]" : "bg-[rgba(255,255,255,0.2)]"
        )}
      >
        <span
          className={cn(
            "absolute rounded-full bg-white shadow transition-transform duration-200",
            s.knob,
            checked ? s.on : s.off
          )}
        />
      </button>
      {labelPosition === "right" && labelEl}
    </label>
  );
}
