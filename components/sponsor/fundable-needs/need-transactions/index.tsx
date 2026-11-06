import { cn } from "@/utils/cn";
import { formatMoney, formatShortDate, plural } from "@/utils/helper";
import { CARD } from "@/components/sponsor/styles";
import type { FundedNeed, SpendTransaction } from "@/components/sponsor/fundable-needs/data";

const STATUS: Record<SpendTransaction["status"], { label: string; dot: string; text: string }> = {
  approved: { label: "Approved", dot: "bg-[#4cc26a]", text: "text-[#a3e3a5]" },
  pending: { label: "Pending", dot: "bg-[#e8a33d]", text: "text-[#ffc999]" },
  declined: { label: "Declined · not an allowed store type", dot: "bg-[#e5484d]", text: "text-[#ff9a9a]" },
};

// What the organization has bought with the need's card. A declined purchase is struck through: it
// never left the card.
export default function NeedTransactions({ funded }: { funded: FundedNeed }) {
  const { transactions } = funded;
  return (
    <div className={cn(CARD, "rounded-[8px] px-[22px] pt-[22px] pb-2 text-white")}>
      <div className="flex flex-wrap justify-between items-baseline gap-3 pb-3">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Transactions</h3>
        <span className="text-[14px] text-[#bdbdbd]">{plural(transactions.length, "transaction")}</span>
      </div>
      {transactions.length === 0 ? (
        <p className="py-6 border-t border-[#222] text-[15px] text-[#bdbdbd]">
          {`No spending yet. The card was issued on ${formatShortDate(funded.cardIssuedOn)}, and purchases will show here as soon as the organization uses it.`}
        </p>
      ) : (
        <ul>
          {transactions.map((t) => {
            const status = STATUS[t.status];
            const declined = t.status === "declined";
            return (
              <li key={t.id} className="flex gap-[14px] items-center py-4 border-t border-[#222]">
                <span aria-hidden="true" className={cn("size-2.5 flex-none rounded-full", status.dot)} />
                <div className="flex-auto min-w-0">
                  <div className="text-base font-semibold">{t.merchant}</div>
                  <div className="mt-0.5 text-[13px] text-[#bdbdbd]">{`${formatShortDate(t.date)} · ${t.category}`}</div>
                  <div className={cn("mt-0.5 text-[13px]", status.text)}>{status.label}</div>
                </div>
                <div className={cn("min-w-[90px] text-right text-base font-bold", declined ? "line-through text-[#8a8a8a]" : "text-white")}>
                  {declined ? formatMoney(t.amount) : `−${formatMoney(t.amount)}`}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
