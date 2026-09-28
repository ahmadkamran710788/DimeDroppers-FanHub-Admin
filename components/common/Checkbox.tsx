import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  // Some-but-not-all selected (e.g. a "Select All" row) — renders a filled square.
  indeterminate?: boolean;
  // "blue": 24px steel-blue box (Setup Wizard). "white": 16px white box with a navy tick.
  variant?: "blue" | "white";
  className?: string;
}

// Visual-only checkbox; the clickable element (button/label) is owned by the caller.
export default function Checkbox({ checked, indeterminate = false, variant = "blue", className }: CheckboxProps) {
  const on = checked || indeterminate;

  if (variant === "white") {
    return (
      <span
        className={cn(
          "w-4 h-4 rounded-[3px] shrink-0 flex items-center justify-center border transition-colors",
          on ? "bg-white border-white" : "border-white/70 bg-transparent",
          className
        )}
      >
        {checked && <Check className="w-3 h-3 text-midnight-navy" strokeWidth={3.5} />}
        {!checked && indeterminate && <span className="w-2 h-2 rounded-[1px] bg-midnight-navy" />}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "w-6 h-6 rounded shrink-0 flex items-center justify-center border-2 transition-colors",
        on ? "bg-steel-blue border-steel-blue" : "border-[rgba(255,255,255,0.3)] bg-transparent",
        className
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      {!checked && indeterminate && <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />}
    </span>
  );
}
