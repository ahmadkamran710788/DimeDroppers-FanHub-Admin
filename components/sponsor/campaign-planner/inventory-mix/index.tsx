import { cn } from "@/utils/cn";
import ProgressBar from "@/components/common/progress-bar";
import SectionCard from "@/components/common/section-card";
import { CARD } from "@/components/sponsor/styles";

interface InventoryMixProps {
  // Per in-app slot, how many of the plan's lines include it.
  mix: { name: string; lineCount: number }[];
  // Lines in the plan.
  count: number;
}

// How many of the plan's lines include each kind of in-app inventory.
export default function InventoryMix({ mix, count }: InventoryMixProps) {
  return (
    <SectionCard title="Inventory mix" className={cn(CARD, "flex-[1_1_380px] min-w-0 gap-3")}>
      {mix.length === 0 ? (
        <p className="text-sm text-[#a8a8a8]">No in-app inventory in the lines still ticked.</p>
      ) : (
        mix.map((item) => (
          <div key={item.name} className="grid grid-cols-[minmax(110px,auto)_1fr_70px] gap-3 items-center text-sm">
            <span>{item.name}</span>
            <ProgressBar
              percent={count ? (item.lineCount / count) * 100 : 0}
              ariaLabel={`Lines with ${item.name}`}
              className="h-2.5"
              barClassName="bg-[#5c8fd6]"
            />
            <span className="text-[#bdbdbd] text-right">
              {item.lineCount} of {count}
            </span>
          </div>
        ))
      )}
    </SectionCard>
  );
}
