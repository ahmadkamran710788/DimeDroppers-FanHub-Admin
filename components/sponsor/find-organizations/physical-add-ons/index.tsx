import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorPhysicalAsset } from "@/utils/types/sponsor-packages";

interface PhysicalAddOnsProps {
  orgName: string;
  physicalAssets: SponsorPhysicalAsset[];
  // Without them the list is a read-only preview (the organisation panel).
  onActivate?: (physicalAsset: SponsorPhysicalAsset) => void;
  onAddToCart?: (physicalAsset: SponsorPhysicalAsset) => void;
  // Already in the sponsor's cart: its Add to cart waits.
  isInCart?: (physicalAsset: SponsorPhysicalAsset) => boolean;
  // The sponsor already has it active: one disabled "Active" in place of both actions.
  isActive?: (physicalAsset: SponsorPhysicalAsset) => boolean;
  // Active for some of the stores but not all ("Active for 2 of 3 stores"); undefined otherwise.
  activeNote?: (physicalAsset: SponsorPhysicalAsset) => string | undefined;
}

// The organization's physical assets (banners, scoreboard wraps…), sold on their own under the packages:
// each with its size, price (its value × the same teams or games), Add to cart and Activate.
export default function PhysicalAddOns({
  orgName,
  physicalAssets,
  onActivate,
  onAddToCart,
  isInCart,
  isActive,
  activeNote,
}: PhysicalAddOnsProps) {
  return (
    <InsetSection
      title={`PHYSICAL ASSETS · ${orgName}`}
      description="Venue placements, activated on their own"
    >
      {physicalAssets.length === 0 ? (
        <p className="text-sm text-[#a8a8a8]">No physical assets offered.</p>
      ) : (
        physicalAssets.map((x) => (
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
              {/* Only its total is shown, not how it's built (value × teams or games). */}
              {x.description && (
                <span className="block text-[13px] text-[#a8a8a8] mt-[2px]">{x.description}</span>
              )}
              {!x.isAvailable && x.unavailableMessage && (
                <span className="block text-[13px] text-[#f0c36a] mt-[2px]">
                  {x.unavailableMessage}
                </span>
              )}
              {!isActive?.(x) && activeNote?.(x) && (
                <span className="block text-[13px] text-[#a3e3a5] mt-[2px]">{activeNote(x)}</span>
              )}
            </span>
            <span className="text-[15px] font-bold whitespace-nowrap">
              {formatCents(x.totalCents, x.currency)}
            </span>
            {isActive?.(x) ? (
              <Button label="Active" disabled className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
            ) : (
              <>
                {onAddToCart && (
                  <Button
                    label={isInCart?.(x) ? "In cart" : "Add to cart"}
                    onClick={() => onAddToCart(x)}
                    disabled={!x.isAvailable || !!isInCart?.(x)}
                    className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
                  />
                )}
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
              </>
            )}
          </div>
        ))
      )}
    </InsetSection>
  );
}
