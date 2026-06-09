"use client";

import { cn } from "@/utils/cn";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Whether the label sits before or after the switch. Defaults to "left". */
  labelPosition?: "left" | "right";
  className?: string;
}

export default function Toggle({ label, checked, onChange, labelPosition = "left", className }: ToggleProps) {
  const labelEl = <span className="text-base font-medium text-white">{label}</span>;
  return (
    <label
      className={cn("flex items-center gap-3 cursor-pointer select-none", className)}
    >
      {labelPosition === "left" && labelEl}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative block shrink-0 w-[52px] h-[30px] rounded-full transition-colors duration-200",
          checked ? "bg-[#34C759]" : "bg-[rgba(255,255,255,0.2)]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[25px]" : "left-[3px]"
          )}
        />
      </button>
      {labelPosition === "right" && labelEl}
    </label>
  );
}
