"use client";

import { cn } from "@/utils/cn";
import { formatCents } from "@/components/sponsor/sponsor-api";
import GamesDetails from "@/components/sponsor/package-splits/games-details";
import { splitSummary } from "@/components/sponsor/package-splits/data";
import type { PackageSplit } from "@/utils/types/sponsor-packages";

// A part's status as the sponsor (or the organisation) sees it.
export type SplitStatus = "Open" | "In cart" | "Active" | "Payment pending" | "Sold";

const STATUS_STYLE: Record<SplitStatus, string> = {
  Open: "bg-[#052e16] text-[#86efac]",
  "In cart": "bg-[#2a2148] text-[#d9ccff]",
  Active: "bg-[#2a2148] text-[#d9ccff]",
  "Payment pending": "bg-[#2b1d05] text-[#fcd34d]",
  Sold: "bg-[#1e222a] text-[#a8a8a8]",
};

interface SplitListProps {
  splits: PackageSplit[];
  currency: string;
  statusOf: (split: PackageSplit) => SplitStatus;
  // The picked part's key. Without onPick the list is read-only (the organisation's preview).
  picked?: string | null;
  onPick?: (splitKey: string) => void;
  // "CHOOSE A PART" or "PARTS".
  title: string;
}

// A package's parts, in date order: each a run of games sold to one sponsor, with its dates, price and status, and
// its games under "See games". An open part can be picked when the list takes picks.
export default function SplitList({ splits, currency, statusOf, picked = null, onPick, title }: SplitListProps) {
  const open = splits.filter((s) => s.status === "AVAILABLE").length;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">
        {`${title} · ${open} OF ${splits.length} OPEN`}
      </div>
      <div
        role={onPick ? "radiogroup" : "list"}
        aria-label={title.toLowerCase()}
        // A max price below one game's makes a part per game: the list scrolls instead of growing the card.
        className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-0.5"
      >
        {splits.map((split) => {
          const status = statusOf(split);
          const pickable = Boolean(onPick) && split.status === "AVAILABLE" && split.splitKey !== null;
          const on = pickable && split.splitKey === picked;
          const head = (
            <>
              {onPick && (
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full",
                    on ? "border-[5px] border-[#8b6dff]" : pickable ? "border-2 border-[#666]" : "border-2 border-[#333]"
                  )}
                />
              )}
              <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">{`Part ${split.number}`}</span>
                <span className="text-xs text-[#a8a8a8]">{splitSummary(split)}</span>
              </span>
              <span className="shrink-0 flex flex-col items-end gap-1">
                {split.totalCents !== null && (
                  <span className="text-[13px] font-semibold">{formatCents(split.totalCents, currency)}</span>
                )}
                <span className={cn("text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap", STATUS_STYLE[status])}>
                  {status}
                </span>
              </span>
            </>
          );
          return (
            <div
              key={split.splitKey ?? `taken-${split.number}`}
              role={onPick ? undefined : "listitem"}
              className={cn(
                "rounded-[8px] border bg-[#1a1a1a]",
                on ? "border-[#8b6dff] bg-[#17151f]" : "border-[#2a2a2a]"
              )}
            >
              {onPick ? (
                // The part's row as a whole is the radio (not an action button); a part that can't be bought is shown
                // the same way, disabled.
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!pickable}
                  onClick={() => pickable && split.splitKey && onPick?.(split.splitKey)}
                  className={cn(
                    "w-full text-left flex items-start gap-2.5 px-[10px] py-2",
                    pickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {head}
                </button>
              ) : (
                <div className="flex items-start gap-2.5 px-[10px] py-2">{head}</div>
              )}
              <GamesDetails games={split.games} className="px-[10px] pb-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
