"use client";

import { cn } from "@/utils/cn";
import Badge from "@/components/common/badge";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { CATEGORY_COLORS } from "@/components/sponsor/find-organizations/data";
import StatusPill, { type SplitStatus } from "@/components/sponsor/find-organizations/package-card/split-status";
import GamesDetails from "@/components/sponsor/package-splits/games-details";
import { formatCents } from "@/components/sponsor/sponsor-api";
import {
  NO_OWN_GAMES,
  holdsPackage,
  isOwnSplit,
  splitSummary,
  type OwnGames,
} from "@/components/sponsor/package-splits/data";
import type { PackageSplit, SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackageCardProps {
  pkg: SponsorPackage;
  // The part of the package this card is for: a run of its games sold to one sponsor. Absent for a package without
  // parts (an older API, one with no games to sell, or a Sponsor AI draft): the card is then the whole package.
  split?: PackageSplit | null;
  // Without them the card is a read-only preview (the organisation's). They get the card's part (null without one).
  onActivate?: (split: PackageSplit | null) => void;
  onAddToCart?: (split: PackageSplit | null) => void;
  // A part (by its key; null without parts) is already in the sponsor's cart: Add to cart waits.
  isInCart?: (splitKey: string | null) => boolean;
  // The games of the sponsor's own parts of this package: active, and still being paid (which holds them too).
  own?: { active: OwnGames; pending: OwnGames };
  // Each placement's own value: shown to the organisation, hidden from sponsors (they see the total).
  showPlacementValues?: boolean;
  // Lays the placements out in two columns once the card is wide enough (the organisation's preview, where the cards
  // share the full width).
  placementsInColumns?: boolean;
  // What the price is counted for when the card is the whole package: "2 games".
  basisCount?: string;
  // The one the Sponsor AI Agent suggests: a purple border and a Recommended badge.
  recommended?: boolean;
  // Lists only this many placements, then "+N more" (the compact cards inside an email).
  slotLimit?: number;
}

// One part of an organization's package, as a whole card: what the package is for, the part's price, games and dates,
// the placements it includes, Add to cart and Activate. A part another sponsor has is greyed out as Sold (its price
// isn't sent), the sponsor's own shows Active or Payment pending. Without a part the card is the whole package; an
// unavailable one keeps its card with the reason and no actions.
export default function PackageCard({
  pkg,
  split = null,
  onActivate,
  onAddToCart,
  isInCart,
  own,
  showPlacementValues = false,
  placementsInColumns = false,
  basisCount,
  recommended = false,
  slotLimit,
}: PackageCardProps) {
  const slots = slotLimit ? pkg.slots.slice(0, slotLimit) : pkg.slots;
  const hiddenSlots = pkg.slots.length - slots.length;
  const interactive = Boolean(onAddToCart || onActivate);
  const active = own?.active ?? NO_OWN_GAMES;
  const pending = own?.pending ?? NO_OWN_GAMES;
  const priced = (pkg.splits ?? []).length > 0;
  const inCart = isInCart?.(split?.splitKey ?? null) ?? false;

  const buyable = split ? pkg.isAvailable && split.status === "AVAILABLE" && split.splitKey !== null : pkg.isAvailable;

  // Nothing to buy here: the one status that replaces both actions (the sponsor's own first).
  function soldStatus(): SplitStatus | null {
    if (buyable) return null;
    if (split) {
      if (split.status !== "TAKEN") return null;
      if (isOwnSplit(split, active)) return "Active";
      if (isOwnSplit(split, pending)) return "Payment pending";
      return "Sold";
    }
    if (holdsPackage(pkg, active)) return "Active";
    if (holdsPackage(pkg, pending)) return "Payment pending";
    return pkg.unavailableReason === "TAKEN" ? "Sold" : null;
  }
  const status = soldStatus();
  // A part always shows where it stands; the whole package only through its button.
  const pill: SplitStatus | null = split ? (status ?? (inCart ? "In cart" : "Open")) : null;

  const price = split ? split.totalCents : pkg.totalCents;
  const priceFor = split ? splitSummary(split) : basisCount;
  const showMessage =
    !pkg.isAvailable &&
    Boolean(pkg.unavailableMessage) &&
    (split ? status === null : status !== "Active" && status !== "Payment pending");

  return (
    <article
      aria-label={split ? `${pkg.name}, ${splitSummary(split)}` : `${pkg.name} package`}
      className={cn(
        "rounded-[12px] p-4 flex flex-col gap-3 border bg-[#0b0b0b]",
        placementsInColumns && "@container",
        recommended ? "border-[#8b6dff]" : "border-[#262626]",
        status === "Sold" ? "opacity-60" : !split && !pkg.isAvailable && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-extrabold text-xl uppercase leading-tight">
            {pkg.name}
          </h4>
          {recommended && <Badge variant="recommended" className="shrink-0 whitespace-nowrap" />}
          {pill && <StatusPill status={pill} className="shrink-0 mt-1" />}
        </div>
        <span className="text-[13px] text-[#a8a8a8]">{pkg.purpose}</span>
      </div>
      <p className="text-[13px] leading-[1.4] text-[#c4c4c4]">
        {pkg.description}
      </p>

      {/* The part's price (a sold part's isn't sent), its games and dates, and the games under "See games"; how the
          price is built (placement values × games) isn't shown. */}
      <div className="flex flex-col gap-1">
        {price !== null && (
          <div className="font-display font-extrabold text-[34px] leading-none">
            {formatCents(price, pkg.currency)}
          </div>
        )}
        {priceFor && <span className="text-[13px] text-[#a8a8a8]">{priceFor}</span>}
        {split && <GamesDetails games={split.games} />}
      </div>

      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">{`PLACEMENTS INCLUDED · ${pkg.slotCount}`}</div>
      <ul className={cn("grid grid-cols-1 gap-1.5", placementsInColumns && "@sm:grid-cols-2")}>
        {slots.map((s) => (
          <li key={s.catalogKey} className="min-w-0 px-[10px] py-2 rounded-[8px] bg-[#1a1a1a] border border-[#2a2a2a]">
            {/* The value sits on the category line, so the name has the row's full width. */}
            <span className="flex items-baseline justify-between gap-2">
              <span
                className="min-w-0 text-[11px] font-bold tracking-[1px] uppercase"
                style={{ color: CATEGORY_COLORS[s.category] ?? "#c4c4c4" }}
              >
                {s.categoryLabel}
              </span>
              {showPlacementValues && (
                <span className="text-[13px] text-[#a8a8a8] whitespace-nowrap">
                  {`${formatCents(s.unitValueCents, pkg.currency)}${priced ? " / game" : ""}`}
                </span>
              )}
            </span>
            <span className="block text-[13px] leading-[1.35] mt-[2px]">
              {s.name}
            </span>
          </li>
        ))}
        {hiddenSlots > 0 && (
          <li className={cn("px-[10px] text-[13px] text-[#a8a8a8]", placementsInColumns && "@sm:col-span-2")}>{`+${hiddenSlots} more`}</li>
        )}
      </ul>

      {/* mt-auto pins the action to the card bottom, so the cards in a row line up. */}
      <div className="mt-auto flex flex-col gap-2">
        {showMessage && (
          <p className={cn("text-[13px]", status === "Sold" ? "text-[#a8a8a8]" : "text-[#f0c36a]")}>{pkg.unavailableMessage}</p>
        )}
        {status ? (
          // On the organisation's read-only preview a part's pill already says it; a whole package has no pill.
          (interactive || !split) && (
            <Button
              label={status}
              disabled
              className={cn(OUTLINE_BUTTON, "w-full h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
            />
          )
        ) : interactive && (
          <div className="flex gap-2">
            {onAddToCart && (
              <Button
                label={inCart ? "In cart" : "Add to cart"}
                onClick={() => onAddToCart(split)}
                disabled={!buyable || inCart}
                className={cn(OUTLINE_BUTTON, "flex-1 h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
              />
            )}
            {onActivate && (
              <Button
                label="Activate"
                onClick={() => onActivate(split)}
                disabled={!buyable}
                className={cn(
                  buyable ? PRIMARY_BUTTON : OUTLINE_BUTTON,
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
