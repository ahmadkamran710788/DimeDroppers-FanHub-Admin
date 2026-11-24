"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import StatusPill, { type SplitStatus } from "@/components/sponsor/find-organizations/package-card/split-status";
import { formatCents } from "@/components/sponsor/sponsor-api";
import {
  holdsPackage,
  openSplits,
  podPrice,
  splitSummary,
  type OwnGames,
} from "@/components/sponsor/package-splits/data";
import type { SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackagePodProps {
  pkg: SponsorPackage;
  // Its cards are showing under the pods.
  open: boolean;
  onToggle: () => void;
  // The id of the cards' region, while it's this pod's.
  cardsId?: string;
  // The games of the sponsor's own parts of it; absent on the organisation's preview.
  own?: { active: OwnGames; pending: OwnGames };
  // What the whole package's price is counted for, when it has no parts: "2 games".
  basisCount?: string;
  // Under the pod, outside its toggle: the organisation's max price field.
  children?: ReactNode;
}

// One package as a pod above its cards: its name, what it's for, the price of its open parts ("from" when they differ),
// how many are open and its placements. The sponsor's own parts mark it Active or Payment pending, and one with none
// left to buy says Sold. Clicking it opens (or closes) its cards.
export default function PackagePod({ pkg, open, onToggle, cardsId, own, basisCount, children }: PackagePodProps) {
  const splits = pkg.splits ?? [];
  const openCount = openSplits(pkg).length;
  const price = podPrice(pkg);

  function podStatus(): SplitStatus | null {
    if (own && holdsPackage(pkg, own.active)) return "Active";
    if (own && holdsPackage(pkg, own.pending)) return "Payment pending";
    if (splits.length > 0 ? openCount === 0 : pkg.unavailableReason === "TAKEN") return "Sold";
    return null;
  }
  const status = podStatus();

  // "2 of 3 open", a single part's games and dates, or the whole package's count; then its placements.
  const facts = [
    splits.length > 1 ? `${openCount} of ${splits.length} open` : splits.length === 1 ? splitSummary(splits[0]) : basisCount,
    plural(pkg.slotCount, "placement"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "rounded-[12px] border flex flex-col transition-colors",
        open ? "border-[#8b6dff] bg-[#17151f]" : "border-[#262626] bg-[#0b0b0b] hover:border-[#555]"
      )}
    >
      {/* A whole clickable card that opens the package's cards, not an action button. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? cardsId : undefined}
        onClick={onToggle}
        className="w-full text-left p-4 flex flex-col gap-2 cursor-pointer"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-display font-extrabold text-lg uppercase leading-tight">{pkg.name}</span>
          <span className="shrink-0 flex items-center gap-1.5">
            {status && <StatusPill status={status} />}
            <ChevronDown
              aria-hidden
              className={cn("size-5 text-[#a8a8a8] transition-transform", open && "rotate-180")}
            />
          </span>
        </span>
        <span className="text-[13px] text-[#a8a8a8]">{pkg.purpose}</span>
        {price && (
          <span className="flex items-baseline gap-1.5">
            {price.from && <span className="text-[13px] font-semibold text-[#a8a8a8]">from</span>}
            <span className="font-display font-extrabold text-[26px] leading-none">
              {formatCents(price.cents, pkg.currency)}
            </span>
          </span>
        )}
        <span className="text-xs text-[#c4c4c4]">{facts}</span>
      </button>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
