"use client";

import Pagination from "@/components/common/pagination";
import StatusPill from "@/components/common/status-pill";
import { cardState } from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import { dollars } from "@/utils/needs";
import type { OrgCardListItem } from "@/utils/types/needs";

interface CardListProps {
  items: OrgCardListItem[];
  total: number;
  selectedId: string;
  onSelect: (cardId: string) => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}

// Every card with its state, the need it serves now and what's left on it; picking one shows it beside the
// list.
export default function CardList({ items, total, selectedId, onSelect, page, pageCount, onPage }: CardListProps) {
  return (
    <section
      aria-label="Cards"
      className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5 rounded-[8px] bg-surface-06 p-3 backdrop-blur-[24px]"
    >
      <h3 className="px-3 pt-2.5 pb-2 text-[13px] font-semibold uppercase tracking-[1px] text-white/60">{`Cards · ${total}`}</h3>
      {items.map(({ card, category, currentNeed }) => {
        const on = card.id === selectedId;
        const state = cardState(card);
        return (
          // A clickable row (shows this card), not an action button.
          <button
            key={card.id}
            type="button"
            aria-current={on ? "true" : undefined}
            onClick={() => onSelect(card.id)}
            className={cn(
              "flex w-full flex-col items-start gap-1.5 rounded-[8px] border px-3.5 py-3 text-left text-white transition-colors",
              on ? "border-[#638BFE] bg-white/10" : "border-transparent hover:bg-white/5"
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="font-semibold">{`•••• ${card.last4 ?? "····"}`}</span>
              <StatusPill label={state.label} color={state.color} className="h-5 px-2" textClassName="text-[11px] font-bold" />
            </span>
            <span className={cn("text-[13px]", currentNeed ? "text-white/85" : "text-white/60 italic")}>
              {currentNeed ? currentNeed.title : `Waiting for your next ${category.name} need`}
            </span>
            <span className="text-xs text-white/60">
              {`${category.name}${currentNeed ? ` · ${dollars(currentNeed.money.availableCents)} available` : ""}`}
            </span>
          </button>
        );
      })}
      <Pagination page={page} pageCount={pageCount} onChange={onPage} className="px-3 pt-2" />
    </section>
  );
}
