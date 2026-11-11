import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import { dollars } from "@/utils/needs";
import { HINT, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";

const COMING_SOON = "Coming soon";
const SECONDARY = cn(OUTLINE_BUTTON, "flex-[1_1_120px] h-[52px] px-4 rounded-[12px] text-[15px] font-semibold");

interface LaunchPanelProps {
  // Lines in the plan.
  count: number;
  totalCents: number;
}

// The plan's total and what can be done with it. Buying, saving and exporting a plan have no API yet, so the
// buttons are shown off ("Coming soon").
export default function LaunchPanel({ count, totalCents }: LaunchPanelProps) {
  return (
    <SectionCard
      title="Ready to launch"
      className="flex-[1_1_380px] min-w-0 bg-[#17151f] border border-[#4a3f7a] backdrop-blur-none gap-[14px]"
    >
      <p className="text-[15px] text-[#d4d4d4] leading-[1.55]">
        Buying sends each organization its package request. Your brand assets are attached automatically, and each
        organization confirms before you’re charged.
      </p>
      <div className="flex justify-between items-baseline gap-3 border-t border-[#2c2547] pt-3">
        <span className="text-[15px] text-[#c4c4c4]">{count === 1 ? "1 package" : `${count} packages`}</span>
        <span className="font-display font-extrabold text-[40px] leading-none">{dollars(totalCents)}</span>
      </div>
      {/* mt-auto keeps the buttons at the card bottom when the inventory mix beside it is taller. */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex flex-wrap gap-[10px]">
          <Button
            label="Buy full package"
            disabled
            title={COMING_SOON}
            className={cn(PRIMARY_BUTTON, "flex-[1_1_180px] h-[52px] px-4 rounded-[12px] text-base")}
          />
          <Button label="Save draft" disabled title={COMING_SOON} className={SECONDARY} />
          <Button label="Export PDF" disabled title={COMING_SOON} className={SECONDARY} />
        </div>
        <p className={HINT}>Buying, saving and exporting a plan: coming soon.</p>
      </div>
    </SectionCard>
  );
}
