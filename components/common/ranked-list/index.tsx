import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";

export interface RankedItem {
  name: string;
  amount: number;
}

interface RankedListProps {
  title: string;
  items: RankedItem[];
  onViewAll: () => void;
  className?: string;
}

// Numbered "top N by amount" card with a View All action (Top Donors, Top Sponsors by Value).
export default function RankedList({ title, items, onViewAll, className }: RankedListProps) {
  return (
    <SectionCard title={title} className={cn("bg-surface-08 lg:p-6", className)}>
      <hr className="border-white/10" />
      <ol className="flex flex-col gap-6">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2 text-white whitespace-nowrap">
            <span className="text-base leading-6 font-semibold">{i + 1}.</span>
            <span className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <span className="text-base leading-6 font-semibold truncate">{item.name}</span>
              <span className="text-sm leading-5 opacity-40">{formatMoney(item.amount)}</span>
            </span>
          </li>
        ))}
      </ol>
      <hr className="border-white/10" />
      <Button label="View All" fullWidth onClick={onViewAll} />
    </SectionCard>
  );
}
