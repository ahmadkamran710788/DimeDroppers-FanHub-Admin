import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorExclusivity } from "@/utils/types/sponsor-packages";

interface PhysicalAddOnsProps {
  orgName: string;
  exclusivities: SponsorExclusivity[];
  // Without it the list is a read-only preview (the organisation panel).
  onActivate?: (exclusivity: SponsorExclusivity) => void;
}

// The organization's exclusivities (banners, scoreboard wraps…), sold on their own under the packages:
// each with its size, price (its value × the same teams or games) and Activate.
export default function PhysicalAddOns({
  orgName,
  exclusivities,
  onActivate,
}: PhysicalAddOnsProps) {
  return (
    <InsetSection
      title={`PHYSICAL ADD-ONS · ${orgName}`}
      description="Venue placements, activated on their own"
    >
      {exclusivities.length === 0 ? (
        <p className="text-sm text-[#a8a8a8]">No physical assets offered.</p>
      ) : (
        exclusivities.map((x) => (
          <div
            key={x.activationId}
            className="w-full min-h-16 px-2.5 sm:px-3 py-[10px] rounded-[10px] border border-[#222] flex flex-wrap items-center gap-2.5 sm:gap-[14px] text-white"
          >
            {x.size && (
              <span className="w-16 h-10 flex-none rounded-[6px] border-[1.5px] border-dashed border-[#555] flex items-center justify-center text-[11px] text-center text-[#a8a8a8]">
                {x.size}
              </span>
            )}
            <span className="flex-auto min-w-0">
              <span className="block text-[15px] font-semibold">{x.name}</span>
              <span className="block text-[13px] text-[#a8a8a8] mt-[2px]">
                {[
                  x.description,
                  `${formatCents(x.unitValueCents, x.currency)} × ${x.factors.map((f) => f.detail).join(" × ")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {!x.isAvailable && x.unavailableMessage && (
                <span className="block text-[13px] text-[#f0c36a] mt-[2px]">
                  {x.unavailableMessage}
                </span>
              )}
            </span>
            <span className="text-[15px] font-bold whitespace-nowrap">
              {formatCents(x.totalCents, x.currency)}
            </span>
            {onActivate && (
              <Button
                label="Activate"
                onClick={() => onActivate(x)}
                disabled={!x.isAvailable}
                className={cn(
                  x.isAvailable ? PRIMARY_BUTTON : OUTLINE_BUTTON,
                  "h-10 px-4 rounded-[10px] text-sm",
                )}
              />
            )}
          </div>
        ))
      )}
    </InsetSection>
  );
}
