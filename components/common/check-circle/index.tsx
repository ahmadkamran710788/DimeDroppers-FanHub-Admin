"use client";

import { cn } from "@/utils/cn";
import { useId } from "react";

interface CheckCircleProps {
  /** Diameter in px. Defaults to 24. */
  size?: number;
  /** Fill color of the circle. Defaults to the success token (#65C162). */
  color?: string;
  className?: string;
}

/**
 * Shared "connected / complete" checkmark used across all wizard steps.
 *
 * A solid green circle with the tick **knocked out** (transparent) via an SVG
 * mask, so the background shows through the check shape — matching Figma.
 */
export default function CheckCircle({ size = 24, color = "var(--color-success)", className }: CheckCircleProps) {
  const maskId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <mask id={maskId}>
        {/* white = visible (the circle), black = hidden (the tick → transparent) */}
        <circle cx="12" cy="12" r="12" fill="white" />
        <path
          d="M7 12.5L10.5 16L17 8.5"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </mask>
      <circle cx="12" cy="12" r="12" fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}
