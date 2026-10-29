"use client";

import { cn } from "@/utils/cn";
import Checkbox from "@/components/common/checkbox";
import type { SponsorNearLocation } from "@/utils/types/sponsor-packages";

interface StoreChecklistProps {
  // The brand's stores near the organisation or event, nearest first.
  stores: SponsorNearLocation[];
  // The ticked store ids.
  picked: string[];
  onChange: (picked: string[]) => void;
  // The radius they were found within (sent with the activation).
  radiusMiles: number;
  // Stores that already have this package or physical asset here: shown ticked, but can't be changed.
  taken?: Set<string>;
  // How many more stores are near than listed (the API lists the nearest 10).
  moreCount?: number;
  // "light" in the white confirm modal, "dark" on a dark card (the cart).
  tone?: "light" | "dark";
}

// Which of the brand's stores an activation is for: one tick per nearby store, with its distance.
export default function StoreChecklist({
  stores,
  picked,
  onChange,
  radiusMiles,
  taken,
  moreCount = 0,
  tone = "dark",
}: StoreChecklistProps) {
  const light = tone === "light";
  const muted = light ? "text-midnight-navy/60" : "text-[#a8a8a8]";

  const toggle = (id: string) => onChange(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className={cn("text-sm font-semibold", light ? "text-midnight-navy" : "text-white")}>
        {`For these stores (within ${radiusMiles} mi)`}
      </div>
      <ul className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
        {stores.map((store) => {
          const isTaken = !!taken?.has(store.id);
          const on = isTaken || picked.includes(store.id);
          return (
            <li key={store.id}>
              {/* A whole clickable row (box, name and distance), not an action button. */}
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={isTaken}
                onClick={() => toggle(store.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-[8px] text-left",
                  light ? "text-midnight-navy hover:bg-midnight-navy/5" : "text-white hover:bg-white/5",
                  isTaken && "opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
              >
                <Checkbox variant="violet" checked={on} />
                <span className="min-w-0 flex-1 text-sm break-words">
                  {store.name || store.city || "Store"}
                  <span className={muted}>{` · ${store.distanceMiles.toFixed(1)} mi`}</span>
                </span>
                {isTaken && <span className={cn("text-xs shrink-0", muted)}>Already active</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {moreCount > 0 && (
        <p className={cn("text-xs", muted)}>{`${moreCount} more of your stores are near too; only the nearest ${stores.length} are listed.`}</p>
      )}
      {/* An activation is always for at least one store (the confirm and the cart wait for one). */}
      {picked.length === 0 && (
        <p className={cn("text-xs", light ? "text-[#b45309]" : "text-[#f0c36a]")}>Tick at least one store.</p>
      )}
    </div>
  );
}
