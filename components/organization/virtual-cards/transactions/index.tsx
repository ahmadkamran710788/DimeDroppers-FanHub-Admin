import { mccLabel } from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import { formatMoney, formatShortDate, plural } from "@/utils/helper";
import type { VirtualCard } from "@/utils/types/fundable-need";

// The card's purchases, newest first. A declined one is struck through with why it was declined.
export default function Transactions({ card }: { card: VirtualCard }) {
  const list = [...card.transactions].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="rounded-[8px] bg-surface-06 text-white backdrop-blur-[24px]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 lg:px-6">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Transactions</h3>
        <span className="text-[13px] text-white/60">{plural(list.length, "transaction")}</span>
      </div>
      {list.length === 0 ? (
        <p className="px-4 py-7 text-center text-sm text-white/60">No purchases yet on this card.</p>
      ) : (
        <ul>
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 last:border-b-0 lg:px-6">
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", t.approved ? "bg-success" : "bg-error")} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium">{t.merchant}</span>
                <span className="text-xs text-white/60">{`${formatShortDate(t.date)} · ${mccLabel(t.mcc)}`}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <span className={cn("font-semibold", !t.approved && "text-white/50 line-through")}>
                  {t.approved ? `−${formatMoney(t.amount)}` : formatMoney(t.amount)}
                </span>
                <span className={cn("text-xs", t.approved ? "text-success" : "text-error")}>
                  {t.approved ? "Approved" : `Declined · ${t.declineReason ?? "not allowed"}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
