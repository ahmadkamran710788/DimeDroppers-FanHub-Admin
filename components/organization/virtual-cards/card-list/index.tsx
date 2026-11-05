"use client";

import StatusPill from "@/components/common/status-pill";
import { availableOf } from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import type { FundableNeed } from "@/utils/types/fundable-need";

interface CardListProps {
  needs: FundableNeed[];
  selectedId: string;
  onSelect: (needId: string) => void;
}

// Every need's card, with its state and what's left on it; picking one shows it beside the list.
export default function CardList({ needs, selectedId, onSelect }: CardListProps) {
  return (
    <section
      aria-label="Cards"
      className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5 rounded-[8px] bg-surface-06 p-3 backdrop-blur-[24px]"
    >
      <h3 className="px-3 pt-2.5 pb-2 text-[13px] font-semibold uppercase tracking-[1px] text-white/60">{`Cards · ${needs.length}`}</h3>
      {needs.map((need) => {
        const on = need.id === selectedId;
        return (
          // A clickable row (shows this card), not an action button.
          <button
            key={need.id}
            type="button"
            aria-current={on ? "true" : undefined}
            onClick={() => onSelect(need.id)}
            className={cn(
              "flex w-full flex-col items-start gap-1.5 rounded-[8px] border px-3.5 py-3 text-left text-white transition-colors",
              on ? "border-[#638BFE] bg-white/10" : "border-transparent hover:bg-white/5"
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="font-semibold">{`•••• ${need.card.last4}`}</span>
              <StatusPill
                label={need.card.frozen ? "Frozen" : "Active"}
                color={need.card.frozen ? "bg-sky-300" : "bg-success"}
                className="h-5 px-2"
                textClassName="text-[11px] font-bold"
              />
            </span>
            <span className="text-[13px] text-white/85">{need.title}</span>
            <span className="text-xs text-white/60">{`${need.type} · ${formatMoney(availableOf(need))} available`}</span>
          </button>
        );
      })}
    </section>
  );
}
