import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import { cn } from "@/utils/cn";

export interface DonutSlice {
  label: string;
  // Shown after the label in the legend, e.g. "$8,710" or "3".
  detail: string;
  percent: number;
  color: string;
}

interface DonutBreakdownProps {
  title: string;
  // Big figure in the middle of the donut and the caption under it.
  centerValue: string;
  centerLabel: string;
  slices: DonutSlice[];
  // Full-width button under the legend; omitted when there is nothing to open.
  actionLabel?: string;
  onAction?: () => void;
  // Shown in place of the legend when there are no slices.
  emptyText?: string;
  className?: string;
}

// Donut built from a conic gradient, starting at 12 o'clock and running clockwise.
// With no slices it is a plain grey ring.
function donutGradient(slices: DonutSlice[]) {
  if (slices.length === 0) return "rgba(255,255,255,0.1)";
  let start = 0;
  const stops = slices.map((s) => {
    const end = start + s.percent;
    const stop = `${s.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

// Titled card with a donut chart, its legend and a full-width action (Giving Overview, Sponsor Breakdown).
export default function DonutBreakdown({
  title,
  centerValue,
  centerLabel,
  slices,
  actionLabel,
  onAction,
  emptyText = "Nothing to show yet.",
  className,
}: DonutBreakdownProps) {
  return (
    <SectionCard title={title} className={cn("bg-surface-07 lg:p-6", className)}>
      <hr className="border-white/10" />
      <div className="flex flex-col gap-10">
        <div
          className="relative size-[300px] max-w-full aspect-square self-center rounded-full"
          style={{ background: donutGradient(slices) }}
        >
          <div className="absolute inset-[35px] rounded-full bg-black/40 backdrop-blur-[24px] flex flex-col items-center justify-center gap-[3px] text-white text-center">
            <span className="font-display font-extrabold text-[56px] leading-[68px] uppercase">{centerValue}</span>
            <span className="text-base leading-6">{centerLabel}</span>
          </div>
        </div>
        {slices.length === 0 ? (
          <p className="text-center text-sm text-white/60">{emptyText}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {slices.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-base leading-6 font-semibold text-white">
                <span className="size-[18px] m-[3px] rounded-full shrink-0" style={{ background: s.color }} />
                {`${s.label} - ${s.detail} (${s.percent}%)`}
              </li>
            ))}
          </ul>
        )}
      </div>
      {actionLabel && onAction && (
        <>
          <hr className="border-white/10" />
          <Button label={actionLabel} fullWidth onClick={onAction} />
        </>
      )}
    </SectionCard>
  );
}
