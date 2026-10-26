import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { CATEGORY_COLORS } from "@/components/sponsor/find-organizations/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorCartLine, SponsorCartQuoteItem } from "@/utils/types/sponsor-packages";

const KIND_LABEL = { PACKAGE: "Package", PHYSICAL_ASSET: "Physical asset" } as const;
const KIND_COLOR = { PACKAGE: CATEGORY_COLORS.PRE_GAME, PHYSICAL_ASSET: CATEGORY_COLORS.PHYSICAL_ASSET } as const;

interface CartLineProps {
  line: SponsorCartLine;
  // Its current price and problems; undefined while the cart is being priced.
  quote?: SponsorCartQuoteItem;
  onRemove: () => void;
  onAcceptPrice: (totalCents: number) => void;
}

// One cart item: what it is, where, its price now (and the old one when it changed) and why it can't
// be activated, if it can't. The organisation's name and logo come from the quote, else from when it
// was added.
export default function CartLine({ line, quote, onRemove, onAcceptPrice }: CartLineProps) {
  const organization = quote?.organization ?? line.organization;
  const unavailable = quote ? !quote.isAvailable : false;
  const newPrice = quote?.priceChanged && !unavailable ? quote.totalCents : null;
  // An item that can't be activated has no current price: the one shown when it was added, greyed.
  const price = !unavailable && quote?.totalCents != null ? quote.totalCents : line.totalCents;
  const currency = quote?.currency ?? line.currency;
  const problem =
    newPrice !== null
      ? `The price has changed from ${formatCents(line.totalCents, currency)} to ${formatCents(newPrice, currency)}`
      : quote?.problem;

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
    </article>
  );
}
