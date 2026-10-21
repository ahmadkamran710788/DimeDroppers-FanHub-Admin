import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Checkbox from "@/components/common/checkbox";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import type { PhysicalAddOn } from "@/components/sponsor/find-organizations/data";

interface PhysicalAddOnsProps {
  orgName: string;
  addOns: PhysicalAddOn[];
  // Indexes of the ticked add-ons.
  picked: ReadonlySet<number>;
  onToggle: (index: number) => void;
}

// The organization's venue space and on-site extras, ticked on top of the package.
export default function PhysicalAddOns({ orgName, addOns, picked, onToggle }: PhysicalAddOnsProps) {
  return (
    <InsetSection
      title={`PHYSICAL ADD-ONS · ${orgName}`}
      description="Venue space and on-site extras offered by this organization"
    >
      {addOns.map((addOn, i) => {
        const on = picked.has(i);
        return (
          // A whole clickable row, not an action button, so it stays a native button.
          <button
            key={addOn.name}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(i)}
            className={cn(
              "w-full min-h-16 px-2.5 sm:px-3 py-[10px] rounded-[10px] border flex items-center gap-2.5 sm:gap-[14px] text-left text-white cursor-pointer",
              on ? "bg-[#17151f] border-[#4a3f7a]" : "bg-transparent border-[#222]"
            )}
          >
            <Checkbox variant="violet" checked={on} />
            <span className="w-12 sm:w-16 h-10 flex-none rounded-[6px] border-[1.5px] border-dashed border-[#555] flex items-center justify-center text-[11px] text-[#a8a8a8]">
              {addOn.size}
            </span>
            <span className="flex-auto min-w-0">
              <span className="block text-[15px] font-semibold">{addOn.name}</span>
              <span className="block text-[13px] text-[#a8a8a8] mt-[2px]">
                {`${addOn.where} · ${addOn.available} available`}
              </span>
            </span>
            <span className="text-[15px] font-bold whitespace-nowrap">{`+${formatMoney(addOn.price)}`}</span>
          </button>
        );
      })}
    </InsetSection>
  );
}
