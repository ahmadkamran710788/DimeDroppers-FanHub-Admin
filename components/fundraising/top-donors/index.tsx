import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import type { TopDonor } from "@/components/fundraising/data";
import { formatMoney } from "@/utils/helper";

interface TopDonorsProps {
  donors: TopDonor[];
  onViewAll: () => void;
}

export default function TopDonors({ donors, onViewAll }: TopDonorsProps) {
  return (
    <SectionCard title="Top Donors" className="bg-surface-08 lg:p-6">
      <hr className="border-white/10" />
      <ol className="flex flex-col gap-6">
        {donors.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-white whitespace-nowrap">
            <span className="text-base leading-6 font-semibold">{i + 1}.</span>
            <span className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <span className="text-base leading-6 font-semibold truncate">{d.name}</span>
              <span className="text-sm leading-5 opacity-40">{formatMoney(d.amount)}</span>
            </span>
          </li>
        ))}
      </ol>
      <hr className="border-white/10" />
      <Button label="View All" fullWidth onClick={onViewAll} />
    </SectionCard>
  );
}
