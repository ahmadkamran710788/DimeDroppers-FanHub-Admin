import { cn } from "@/utils/cn";
import { CARD } from "@/components/sponsor/styles";
import { TEMPLATE_BAR } from "@/components/sponsor/brand-placements/data";
import { TEMPLATE_NAME, type SlotDetail } from "@/components/sponsor/brand-placements/performance/use-performance";

interface WeeklyChartProps {
  chart: SlotDetail["chart"];
}

// The selected slot week by week over its whole tenure, measured as its setup now.
export default function WeeklyChart({ chart }: WeeklyChartProps) {
  return (
    <figure className={cn(CARD, "m-0 rounded-[14px] p-5 flex flex-col gap-[14px]")}>
      <figcaption className="flex flex-col gap-1">
        <span className="font-display font-black text-xl">{chart.title}</span>
        <span className="text-[13px] text-[#a8a8a8]">{chart.sub}</span>
      </figcaption>
      <div aria-label="Setups" className="flex flex-wrap gap-[14px]">
        {chart.legend.map((l) => (
          <span key={l.when} className="flex items-center gap-2 text-[13px] text-[#d4d4d8]">
            <span aria-hidden="true" className={cn("size-3 flex-none rounded-[3px]", TEMPLATE_BAR[l.template], l.faded && "opacity-45")} />
            <strong className="font-semibold">{TEMPLATE_NAME[l.template]}</strong>
            <span className="text-[#a8a8a8]">{l.when}</span>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div role="img" aria-label={chart.ariaLabel} className="flex items-end gap-2 h-[200px] border-b border-[#2a2f3a]">
            {chart.bars.map((b) => (
              <div key={b.label} className="flex-[1_1_0] min-w-0 h-full flex flex-col justify-end items-center gap-1.5">
                <span className="text-[11px] tabular-nums text-[#d4d4d8]">{b.value}</span>
                <span
                  className={cn(
                    "block w-full max-w-[56px] rounded-t-[6px]",
                    b.colored ? TEMPLATE_BAR[b.template] : "bg-[#2a2f3a]",
                    !b.active && "opacity-45"
                  )}
                  style={{ height: b.height }}
                />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="flex gap-2 pt-2">
            {chart.bars.map((b) => (
              <span key={b.label} className="flex-[1_1_0] min-w-0 text-center text-[11px] text-[#a8a8a8]">
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="text-[13px] text-[#d4d4d8]">
        {chart.note} {chart.average}
      </span>
    </figure>
  );
}
