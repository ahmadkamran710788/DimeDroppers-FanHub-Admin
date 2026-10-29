import { cn } from "@/utils/cn";
import Badge from "@/components/common/badge";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { CATEGORY_COLORS } from "@/components/sponsor/find-organizations/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackageCardProps {
  pkg: SponsorPackage;
  // Without them the card is a read-only preview (the organisation panel).
  onActivate?: () => void;
  onAddToCart?: () => void;
  // Already in the sponsor's cart: Add to cart waits.
  inCart?: boolean;
  // The sponsor already has it active: one disabled "Active" in place of both actions.
  active?: boolean;
  // Active for some of the stores but not all ("Active for 2 of 3 stores"): shown above the actions.
  activeNote?: string;
  // Each placement's own value: shown to the organisation, hidden from sponsors (they see the total).
  showPlacementValues?: boolean;
  // What the price is counted for, under it: "2 games", "5 teams".
  basisCount?: string;
  // The one the Sponsor AI Agent suggests: a purple border and a Recommended badge.
  recommended?: boolean;
  // Lists only this many placements, then "+N more" (the compact cards inside an email).
  slotLimit?: number;
}

// One of an organization's three packages: what it's for, its total price, the placements it includes,
// Add to cart and Activate. An unavailable package keeps its card with the reason and neither action.
export default function PackageCard({
  pkg,
  onActivate,
  onAddToCart,
  inCart = false,
  active = false,
  activeNote,
  showPlacementValues = false,
  basisCount,
  recommended = false,
  slotLimit,
}: PackageCardProps) {
  const slots = slotLimit ? pkg.slots.slice(0, slotLimit) : pkg.slots;
  const hiddenSlots = pkg.slots.length - slots.length;
  return (
    <article
      aria-label={`${pkg.name} package`}
      className={cn(
        "rounded-[12px] p-4 flex flex-col gap-3 border bg-[#0b0b0b]",
        recommended ? "border-[#8b6dff]" : "border-[#262626]",
        !pkg.isAvailable && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-extrabold text-xl uppercase leading-tight">
            {pkg.name}
          </h4>
          {recommended && <Badge variant="recommended" className="shrink-0 whitespace-nowrap" />}
        </div>
        <span className="text-[13px] text-[#a8a8a8]">{pkg.purpose}</span>
      </div>
      <p className="text-[13px] leading-[1.4] text-[#c4c4c4]">
        {pkg.description}
      </p>

      {/* The total and what it's counted for ("2 games"); how it's built (placement values × games)
          isn't shown. */}
      <div className="flex flex-col gap-1">
        <div className="font-display font-extrabold text-[34px] leading-none">
          {formatCents(pkg.totalCents, pkg.currency)}
        </div>
        {basisCount && <span className="text-[13px] text-[#a8a8a8]">{basisCount}</span>}
      </div>

      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">{`PLACEMENTS INCLUDED · ${pkg.slotCount}`}</div>
      <ul className="flex flex-col gap-1.5">
        {slots.map((s) => (
          <li
            key={s.catalogKey}
            className="px-[10px] py-2 rounded-[8px] bg-[#1a1a1a] border border-[#2a2a2a] flex items-start justify-between gap-2"
          >
            <span className="min-w-0">
              <span
                className="block text-[11px] font-bold tracking-[1px] uppercase"
                style={{ color: CATEGORY_COLORS[s.category] ?? "#c4c4c4" }}
              >
                {s.categoryLabel}
              </span>
              <span className="block text-[13px] leading-[1.35] mt-[2px]">
                {s.name}
              </span>
            </span>
            {showPlacementValues && (
              <span className="text-[13px] text-[#a8a8a8] whitespace-nowrap">
                {formatCents(s.unitValueCents, pkg.currency)}
              </span>
            )}
          </li>
        ))}
        {hiddenSlots > 0 && <li className="px-[10px] text-[13px] text-[#a8a8a8]">{`+${hiddenSlots} more`}</li>}
      </ul>

      {/* mt-auto pins the action to the card bottom, so the cards in a row line up. */}
      <div className="mt-auto flex flex-col gap-2">
        {!pkg.isAvailable && pkg.unavailableMessage && (
          <p className="text-[13px] text-[#f0c36a]">{pkg.unavailableMessage}</p>
        )}
        {!active && activeNote && <p className="text-[13px] text-[#a3e3a5]">{activeNote}</p>}
        {active ? (
          <Button
            label="Active"
            disabled
            className={cn(OUTLINE_BUTTON, "w-full h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
          />
        ) : (onAddToCart || onActivate) && (
          <div className="flex gap-2">
            {onAddToCart && (
              <Button
                label={inCart ? "In cart" : "Add to cart"}
                onClick={onAddToCart}
                disabled={!pkg.isAvailable || inCart}
                className={cn(OUTLINE_BUTTON, "flex-1 h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
              />
            )}
            {onActivate && (
              <Button
                label="Activate"
                onClick={onActivate}
                disabled={!pkg.isAvailable}
                className={cn(
                  pkg.isAvailable ? PRIMARY_BUTTON : OUTLINE_BUTTON,
                  "flex-1 h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none",
                )}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
