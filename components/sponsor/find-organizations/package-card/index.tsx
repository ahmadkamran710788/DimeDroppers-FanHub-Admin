import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { CATEGORY_COLORS } from "@/components/sponsor/find-organizations/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackageCardProps {
  pkg: SponsorPackage;
  // Without it the card is a read-only preview (the organisation panel).
  onActivate?: () => void;
}

// One of an organization's three packages: what it's for, the slots it includes with their value, how
// the price is built (slot values × teams or games) and Activate. An unavailable package keeps its
// card with the reason and no Activate.
export default function PackageCard({ pkg, onActivate }: PackageCardProps) {
  return (
    <article
      aria-label={`${pkg.name} package`}
      className={cn(
        "rounded-[12px] p-4 flex flex-col gap-3 border bg-[#0b0b0b]",
        pkg.isAvailable ? "border-[#262626]" : "border-[#262626] opacity-80",
      )}
    >
      <div className="flex flex-col gap-1">
        <h4 className="font-display font-extrabold text-xl uppercase leading-tight">
          {pkg.name}
        </h4>
        <span className="text-[13px] text-[#a8a8a8]">{pkg.purpose}</span>
      </div>
      <p className="text-[13px] leading-[1.4] text-[#c4c4c4]">
        {pkg.description}
      </p>

      <div>
        <div className="font-display font-extrabold text-[34px] leading-none">
          {formatCents(pkg.totalCents, pkg.currency)}
        </div>
        {/* "$25.00 × 5 teams": every factor is shown, more are coming. */}
        <div className="text-[13px] text-[#a8a8a8] mt-1">
          {`${formatCents(pkg.slotValueTotalCents, pkg.currency)} × ${pkg.factors.map((f) => f.detail).join(" × ")}`}
        </div>
      </div>

      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">{`SLOTS INCLUDED · ${pkg.slotCount}`}</div>
      <ul className="flex flex-col gap-1.5">
        {pkg.slots.map((s) => (
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
            <span className="text-[13px] text-[#a8a8a8] whitespace-nowrap">
              {formatCents(s.unitValueCents, pkg.currency)}
            </span>
          </li>
        ))}
      </ul>

      {/* mt-auto pins the action to the card bottom, so the cards in a row line up. */}
      <div className="mt-auto flex flex-col gap-2">
        {!pkg.isAvailable && pkg.unavailableMessage && (
          <p className="text-[13px] text-[#f0c36a]">{pkg.unavailableMessage}</p>
        )}
        {onActivate && (
          <Button
            label="Activate"
            onClick={onActivate}
            disabled={!pkg.isAvailable}
            fullWidth
            className={cn(
              pkg.isAvailable ? PRIMARY_BUTTON : OUTLINE_BUTTON,
              "h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none",
            )}
          />
        )}
      </div>
    </article>
  );
}
