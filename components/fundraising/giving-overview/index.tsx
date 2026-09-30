import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import type { GivingSlice } from "@/components/fundraising/data";
import { formatMoney } from "@/utils/helper";

interface GivingOverviewProps {
  total: number;
  slices: GivingSlice[];
  onViewReports: () => void;
}

// Donut built from a conic gradient, starting at 12 o'clock and running clockwise.
function donutGradient(slices: GivingSlice[]) {
  let start = 0;
  const stops = slices.map((s) => {
    const end = start + s.percent;
    const stop = `${s.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function GivingOverview({ total, slices, onViewReports }: GivingOverviewProps) {
  return (
    <SectionCard title="Giving Overview" className="bg-surface-07 lg:p-6">
      <hr className="border-white/10" />
      <div className="flex flex-col gap-10">
        <div
          className="relative size-[300px] max-w-full aspect-square self-center rounded-full"
          style={{ background: donutGradient(slices) }}
        >
          <div className="absolute inset-[35px] rounded-full bg-black/40 backdrop-blur-[24px] flex flex-col items-center justify-center gap-[3px] text-white text-center">
            <span className="font-display font-extrabold text-[56px] leading-[68px] uppercase">
              {formatMoney(total)}
            </span>
            <span className="text-base leading-6">Total Raised</span>
          </div>
        </div>
        <ul className="flex flex-col gap-4">
          {slices.map((s) => (
            <li key={s.type} className="flex items-center gap-2 text-base leading-6 font-semibold text-white">
              <span className="size-[18px] m-[3px] rounded-full shrink-0" style={{ background: s.color }} />
              {`${s.type} - ${formatMoney(s.amount)} (${s.percent}%)`}
            </li>
          ))}
        </ul>
      </div>
      <hr className="border-white/10" />
      <Button label="View Donation Reports" fullWidth onClick={onViewReports} />
    </SectionCard>
  );
}
