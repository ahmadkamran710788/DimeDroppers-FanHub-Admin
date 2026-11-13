import { cn } from "@/utils/cn";
import ProgressBar from "@/components/common/progress-bar";
import { CARD } from "@/components/sponsor/styles";
import type { Bar } from "@/components/sponsor/brand-placements/performance/use-performance";

interface BarChartProps {
  title: string;
  sub: string;
  bars: Bar[];
}

// Fans reached per organization or inventory, largest first.
export default function BarChart({ title, sub, bars }: BarChartProps) {
  return (
    <figure className={cn(CARD, "m-0 rounded-[14px] p-5 flex flex-col gap-4")}>
      <figcaption className="flex flex-col gap-1">
        <span className="font-display font-black text-[19px]">{title}</span>
        <span className="text-[13px] text-[#a8a8a8]">{sub}</span>
      </figcaption>
      <div className="flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-[10px] text-sm">
              <span className="min-w-0">{b.label}</span>
              <span className="font-semibold tabular-nums whitespace-nowrap">{b.value}</span>
            </div>
            <ProgressBar percent={b.percent} ariaLabel={`${b.label}: ${b.value}`} className="h-3 bg-[#1e222a]" barClassName="bg-[#7c6cff]" />
          </div>
        ))}
      </div>
    </figure>
  );
}
