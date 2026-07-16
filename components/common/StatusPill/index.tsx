import { cn } from "@/utils/cn";

interface StatusPillProps {
  label: string;
  /** Fill background utility, e.g. "bg-green-400" / "bg-white/30". */
  color: string;
  /** Override height/padding on the pill (e.g. "h-5 px-2"). */
  className?: string;
  /** Override the label text utilities (e.g. "text-[11px] capitalize"). */
  textClassName?: string;
}

/**
 * Filled status pill: colored background + dark text. Used in dark data tables.
 * Defaults match the schedule table's pill; pass className/textClassName to
 * reproduce other sizings (e.g. the exposure modal's smaller badge).
 */
export default function StatusPill({ label, color, className, textClassName }: StatusPillProps) {
  return (
    <span className={cn("inline-flex h-6 px-3 rounded-full items-center", color, className)}>
      <span className={cn("text-slate-900 text-xs font-medium", textClassName)}>{label}</span>
    </span>
  );
}
