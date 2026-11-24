"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import Badge from "@/components/common/badge";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { CATEGORY_COLORS } from "@/components/sponsor/find-organizations/data";
import SplitList, { type SplitStatus } from "@/components/sponsor/find-organizations/package-card/split-list";
import { formatCents } from "@/components/sponsor/sponsor-api";
import {
  NO_OWN_GAMES,
  holdsPackage,
  isOwnSplit,
  partLabel,
  splitSummary,
  type OwnGames,
} from "@/components/sponsor/package-splits/data";
import type { PackageSplit, SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackageCardProps {
  pkg: SponsorPackage;
  // Without them the card is a read-only preview (the organisation panel). They get the picked part (null for a
  // package without parts, e.g. from an older API).
  onActivate?: (split: PackageSplit | null) => void;
  onAddToCart?: (split: PackageSplit | null) => void;
  // A part (by its key; null without parts) is already in the sponsor's cart: Add to cart waits.
  isInCart?: (splitKey: string | null) => boolean;
  // The games of the sponsor's own parts of this package: active, and still being paid (which holds them too).
  own?: { active: OwnGames; pending: OwnGames };
  // Each placement's own value: shown to the organisation, hidden from sponsors (they see the total).
  showPlacementValues?: boolean;
  // Lays the placements out in two columns once the card is wide enough (the organisation's preview, where the three
  // cards share the full width).
  placementsInColumns?: boolean;
  // What the price is counted for when the package has no parts: "2 games".
  basisCount?: string;
  // The one the Sponsor AI Agent suggests: a purple border and a Recommended badge.
  recommended?: boolean;
  // Lists only this many placements, then "+N more" (the compact cards inside an email).
  slotLimit?: number;
  // Under the price, e.g. the organisation's max price field.
  children?: ReactNode;
}

// One of an organization's three packages: what it's for, its price, the placements it includes, Add to cart and
// Activate. A package is priced by its games and can be cut into parts (the organisation's max price), each a run of
// games sold to one sponsor: the card lists them, the sponsor picks an open one, and the price and actions follow
// it. Parts another sponsor has show as Sold, the sponsor's own as Active or Payment pending. An unavailable package
// keeps its card with the reason and no actions.
export default function PackageCard({
  pkg,
  onActivate,
  onAddToCart,
  isInCart,
  own,
  showPlacementValues = false,
  placementsInColumns = false,
  basisCount,
  recommended = false,
  slotLimit,
  children,
}: PackageCardProps) {
  const [picked, setPicked] = useState<string | null>(pkg.splitKey);
  const slots = slotLimit ? pkg.slots.slice(0, slotLimit) : pkg.slots;
  const hiddenSlots = pkg.slots.length - slots.length;
  const interactive = Boolean(onAddToCart || onActivate);
  const active = own?.active ?? NO_OWN_GAMES;
  const pending = own?.pending ?? NO_OWN_GAMES;

  // An API from before parts sends none.
  const splits = pkg.splits ?? [];
  const open = splits.filter((s) => s.status === "AVAILABLE" && s.splitKey);
  // The part the price and actions are for: the picked one while it's still open, else the first open one.
  const selected = open.find((s) => s.splitKey === picked) ?? open[0] ?? null;
  const inCart = (split: PackageSplit | null) => isInCart?.(split?.splitKey ?? null) ?? false;

  function statusOf(split: PackageSplit): SplitStatus {
    if (split.status === "AVAILABLE") return inCart(split) ? "In cart" : "Open";
    if (isOwnSplit(split, active)) return "Active";
    if (isOwnSplit(split, pending)) return "Payment pending";
    return "Sold";
  }

  // Nothing left to buy: the one status that replaces both actions (the sponsor's own first).
  const buyable = pkg.isAvailable && (splits.length === 0 || selected !== null);
  const status = buyable
    ? null
    : holdsPackage(pkg, active)
      ? "Active"
      : holdsPackage(pkg, pending)
        ? "Payment pending"
        : pkg.unavailableReason === "TAKEN"
          ? "Sold"
          : null;
  const price = selected?.totalCents ?? pkg.totalCents;
  const priceFor = selected
    ? [partLabel(selected.number, splits.length), splitSummary(selected)].filter(Boolean).join(" · ")
    : basisCount;

  return (
    <article
      aria-label={`${pkg.name} package`}
      className={cn(
        "rounded-[12px] p-4 flex flex-col gap-3 border bg-[#0b0b0b]",
        placementsInColumns && "@container",
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

      {/* The price of the part it's for ("Part 2 of 3 · 7 games · Dec 19 – Jan 30, 2027"); how it's built
          (placement values × games) isn't shown. */}
      <div className="flex flex-col gap-1">
        <div className="font-display font-extrabold text-[34px] leading-none">
          {formatCents(price, pkg.currency)}
        </div>
        {priceFor && <span className="text-[13px] text-[#a8a8a8]">{priceFor}</span>}
      </div>

      {children}

      {splits.length > 1 && (
        <SplitList
          splits={splits}
          currency={pkg.currency}
          statusOf={statusOf}
          title={interactive ? "CHOOSE A PART" : "PARTS"}
          picked={selected?.splitKey ?? null}
          onPick={interactive ? setPicked : undefined}
        />
      )}

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
                  {`${formatCents(s.unitValueCents, pkg.currency)}${splits.length > 0 ? " / game" : ""}`}
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
        {!pkg.isAvailable && pkg.unavailableMessage && status !== "Active" && status !== "Payment pending" && (
          <p className={cn("text-[13px]", status === "Sold" ? "text-[#a8a8a8]" : "text-[#f0c36a]")}>{pkg.unavailableMessage}</p>
        )}
        {status ? (
          <Button
            label={status}
            disabled
            className={cn(OUTLINE_BUTTON, "w-full h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
          />
        ) : interactive && (
          <div className="flex gap-2">
            {onAddToCart && (
              <Button
                label={inCart(selected) ? "In cart" : "Add to cart"}
                onClick={() => onAddToCart(selected)}
                disabled={!buyable || inCart(selected)}
                className={cn(OUTLINE_BUTTON, "flex-1 h-11 px-[6px] rounded-[10px] text-sm font-semibold transition-none")}
              />
            )}
            {onActivate && (
              <Button
                label="Activate"
                onClick={() => onActivate(selected)}
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
