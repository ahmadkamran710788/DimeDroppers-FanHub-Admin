import { cn } from "@/utils/cn";

interface ProgressBarProps {
  // 0–100.
  percent: number;
  ariaLabel?: string;
  // The track: height and background.
  className?: string;
  // The fill: its color.
  barClassName?: string;
}

// Thin rounded progress bar (fundraising progress, share of spend).
export default function ProgressBar({ percent, ariaLabel, className, barClassName }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn("h-2 rounded-full bg-[#262626] overflow-hidden", className)}
    >
      <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${value}%` }} />
    </div>
  );
}
