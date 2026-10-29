"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import StoreChecklist from "@/components/sponsor/store-checklist";
import { KIND_COLOR, KIND_LABEL } from "@/components/sponsor/find-organizations/data";
import { storeNames } from "@/components/sponsor/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorCartLine, SponsorCartQuoteItem } from "@/utils/types/sponsor-packages";

interface CartLineProps {
  line: SponsorCartLine;
  // Its current price and problems; undefined while the cart is being priced.
  quote?: SponsorCartQuoteItem;
  // The sponsor already has it active: it can't be activated again.
  alreadyActive?: boolean;
  onRemove: () => void;
  onAcceptPrice: (totalCents: number) => void;
  // Which of the line's stores it is for.
  onStoresChange: (storeIds: string[]) => void;
}

// One cart item: what it is, where, the stores it is for (changeable), its price now (and the old one when
// it changed) and why it can't be activated, if it can't. The organisation's name and logo come from the
// quote, else from when it was added.
export default function CartLine({
  line,
  quote,
  alreadyActive = false,
  onRemove,
  onAcceptPrice,
  onStoresChange,
}: CartLineProps) {
  const [editingStores, setEditingStores] = useState(false);
  const organization = quote?.organization ?? line.organization;
  const unavailable = alreadyActive || (quote ? !quote.isAvailable : false);
  const newPrice = quote?.priceChanged && !unavailable ? quote.totalCents : null;
  // An item that can't be activated has no current price: the one shown when it was added, greyed.
  const price = !unavailable && quote?.totalCents != null ? quote.totalCents : line.totalCents;
  const currency = quote?.currency ?? line.currency;
  const problem = alreadyActive
    ? "You already have this sponsorship active. Remove it to continue."
    : newPrice !== null
      ? `The price has changed from ${formatCents(line.totalCents, currency)} to ${formatCents(newPrice, currency)}`
      : quote?.problem;

  const pickedIds = line.item.sponsorLocationIds ?? [];
  // The quote's stores carry their distance; while it prices (or when it has a problem) the ones picked here.
  const forStores = quote?.locations.length
    ? quote.locations
    : (line.stores?.near ?? []).filter((s) => pickedIds.includes(s.id));

  return (
    <article
      aria-label={line.name}
      className={cn(
        "rounded-[12px] border bg-[#0b0b0b] p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4",
        problem ? "border-[#5a4a1f]" : "border-[#262626]"
      )}
    >
      <OrgMonogram logoUrl={organization.logoUrl} size="md" />
      <div className="flex-[1_1_220px] min-w-0 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[15px] font-semibold break-words">{quote?.name ?? line.name}</h4>
          <span
            className="text-[11px] font-bold tracking-[1px] uppercase"
            style={{ color: KIND_COLOR[line.kind] }}
          >
            {KIND_LABEL[line.kind]}
          </span>
        </div>
        <p className="text-[13px] text-[#a8a8a8] break-words">
          {[organization.name ?? "Unnamed organization", (quote?.event ?? line.event)?.name].filter(Boolean).join(" · ")}
        </p>
        {line.stores && (
          <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
            <span className="text-[#c9b8ff] break-words">
              {forStores.length ? `For: ${storeNames(forStores)}` : "For no store"}
            </span>
            <Button
              variant="text"
              size="sm"
              label={editingStores ? "Done" : "Edit stores"}
              aria-expanded={editingStores}
              onClick={() => setEditingStores((open) => !open)}
              className="h-7 text-[13px] font-semibold text-[#c9b8ff] hover:text-white"
            />
          </div>
        )}
        {problem && <p className="text-[13px] text-[#f0c36a]">{problem}</p>}
      </div>
      <span className={cn("text-[15px] font-bold whitespace-nowrap", unavailable && "text-[#757575] line-through")}>
        {formatCents(price, currency)}
      </span>
      <div className="flex gap-2">
        {newPrice !== null && (
          <Button
            label="Accept new price"
            onClick={() => onAcceptPrice(newPrice)}
            className={cn(PRIMARY_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
          />
        )}
        <Button label="Remove" onClick={onRemove} className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
      </div>
      {editingStores && line.stores && (
        <div className="basis-full border-t border-[#222] pt-3">
          <StoreChecklist
            stores={line.stores.near}
            picked={pickedIds}
            radiusMiles={line.stores.radiusMiles}
            onChange={onStoresChange}
          />
        </div>
      )}
    </article>
  );
}
