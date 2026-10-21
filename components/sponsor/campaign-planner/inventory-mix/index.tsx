import { cn } from "@/utils/cn";
import ProgressBar from "@/components/common/progress-bar";
import SectionCard from "@/components/common/section-card";
import { CARD } from "@/components/sponsor/styles";
import type { InventorySummary } from "@/components/sponsor/campaign-planner/summarize-plan";

interface InventoryMixProps {
  mix: InventorySummary[];
  // Packages in the plan.
  count: number;
}

// How many of the plan's packages include each kind of in-app inventory.
export default function InventoryMix({ mix, count }: InventoryMixProps) {
  return (
    <SectionCard title="Inventory mix" className={cn(CARD, "flex-[1_1_380px] min-w-0 gap-3")}>
      {mix.map((item) => (
        <div key={item.name} className="grid grid-cols-[110px_1fr_70px] gap-3 items-center text-sm">
          <span>{item.name}</span>
          <ProgressBar
            percent={count ? (item.count / count) * 100 : 0}
            ariaLabel={`Packages with ${item.name}`}
            className="h-2.5"
            barClassName="bg-[#5c8fd6]"
          />
          <span className="text-[#bdbdbd] text-right">
            {item.count} of {count}
          </span>
        </div>
      ))}
    </SectionCard>
  );
}
