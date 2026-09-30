import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TooltipProps {
  label: string;
  children: ReactNode;
  // Which side of the trigger the tooltip appears on.
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Small dark label shown on hover or keyboard focus of its trigger (e.g. header icons).
 * Keyboard focus only (:focus-visible), so it doesn't stick after a mouse click.
 * CSS-only; the trigger should carry its own aria-label.
 */
export default function Tooltip({ label, children, side = "bottom", className }: TooltipProps) {
  return (
    <span className={cn("relative inline-flex group", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap",
          "rounded-[6px] px-2 py-1 text-xs font-medium text-white bg-midnight-navy shadow-lg",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
          side === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
