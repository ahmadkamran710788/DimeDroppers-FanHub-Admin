"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { formatInstantDate, plural } from "@/utils/helper";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { CARD, OUTLINE_BUTTON } from "@/components/sponsor/styles";
import {
  TRANSACTIONS_PAGE_SIZE,
  dollars,
  humanizeSlug,
  placeLabel,
} from "@/components/sponsor/fundable-needs/data";
import type { MerchantCategory, NeedUtilization, UtilizationTransaction } from "@/utils/types/needs";

// How each kind of card activity reads: a purchase takes money off the card, a merchant refund puts it back.
const KIND = {
  CAPTURE: { dot: "bg-[#4cc26a]", text: "text-[#a3e3a5]", sign: "−", amount: "text-white" },
  REFUND: { dot: "bg-[#5b9bff]", text: "text-[#9fc2ff]", sign: "+", amount: "text-[#a3e3a5]" },
} as const;

function statusLine(t: UtilizationTransaction) {
  const share = dollars(Math.abs(t.yourShareCents));
  if (t.type === "REFUND") return `Refunded by merchant · ${share} back to you`;
  return `Approved · your share ${share}`;
}

interface Loaded {
  key: string;
  view?: NeedUtilization;
  error?: string;
}

interface NeedTransactionsProps {
  needId: string;
  // The need's store types, for a readable merchant category.
  allowedCategories: MerchantCategory[];
  // Bumped by the page after a payment.
  refresh: number;
}

// Where this sponsor's money went (GET /fanhub/sponsor-needs/:needId/utilization): each purchase on the
// need's card with the sponsor's share of it, and any unused money refunded after the need closed. The parent
// remounts it (key) for another need, so it starts on page 1.
export default function NeedTransactions({ needId, allowedCategories, refresh }: NeedTransactionsProps) {
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `${needId}|${page}|${reloads}|${refresh}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<NeedUtilization>("GET", routes.api.sponsorNeedUtilization(needId), {
      params: { page, limit: TRANSACTIONS_PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setLoaded({ key, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, needId, page]);

  const current = loaded?.key === key ? loaded : null;
  const report = current?.view;
  const transactions = report?.transactions ?? [];

  const categoryLabel = (slug: string | null) =>
    slug ? (allowedCategories.find((c) => c.stripeCategory === slug)?.label ?? humanizeSlug(slug)) : null;

  return (
    <div className={cn(CARD, "rounded-[8px] px-[22px] pt-[22px] pb-2 text-white")}>
      <div className="flex flex-wrap justify-between items-baseline gap-3 pb-3">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Transactions</h3>
        {report && (
          <span className="text-[14px] text-[#bdbdbd]">
            {plural(report.pagination.total, "transaction")}
            {report.totalPendingCents > 0 && ` · ${dollars(report.totalPendingCents)} still settling`}
          </span>
        )}
      </div>

      {!current ? (
        <div className="py-6 border-t border-[#222]">
          <Loader />
        </div>
      ) : current.error ? (
        <div className="py-4 border-t border-[#222] flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#f0c36a]">{`Couldn't load the transactions: ${current.error}`}</p>
          <Button
            label="Retry"
            onClick={() => setReloads((n) => n + 1)}
            className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
          />
        </div>
      ) : (
        <>
          {report && report.refunds.length > 0 && (
            <ul className="border-t border-[#222]">
              {report.refunds.map((refund, i) => (
                <li key={refund.id ?? i} className="flex gap-[14px] items-center py-4">
                  <span aria-hidden="true" className="size-2.5 flex-none rounded-full bg-[#b48cff]" />
                  <div className="flex-auto min-w-0">
                    <div className="text-base font-semibold">Unused funds refunded to you</div>
                    <div className="mt-0.5 text-[13px] text-[#bdbdbd]">
                      {[refund.createdAt && formatInstantDate(refund.createdAt), humanizeSlug(refund.status.toLowerCase())]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="min-w-[90px] text-right text-base font-bold text-[#a3e3a5]">
                    {`+${dollars(refund.amountCents)}`}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {transactions.length === 0 ? (
            <p className="py-6 border-t border-[#222] text-[15px] text-[#bdbdbd]">
              No spending yet. Purchases will show here as soon as the organization uses the card.
            </p>
          ) : (
            <ul>
              {transactions.map((t) => {
                const kind = KIND[t.type] ?? KIND.CAPTURE;
                const meta = [
                  formatInstantDate(t.occurredAt),
                  categoryLabel(t.merchantCategory),
                  placeLabel(t.merchantCity, t.merchantState),
                ].filter(Boolean);
                return (
                  <li key={t.id} className="flex gap-[14px] items-center py-4 border-t border-[#222]">
                    <span aria-hidden="true" className={cn("size-2.5 flex-none rounded-full", kind.dot)} />
                    <div className="flex-auto min-w-0">
                      <div className="text-base font-semibold break-words">{t.merchantName || "Card purchase"}</div>
                      <div className="mt-0.5 text-[13px] text-[#bdbdbd]">{meta.join(" · ")}</div>
                      <div className={cn("mt-0.5 text-[13px]", kind.text)}>{statusLine(t)}</div>
                    </div>
                    <div className={cn("min-w-[90px] text-right text-base font-bold", kind.amount)}>
                      {`${kind.sign}${dollars(t.amountCents)}`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Pagination
            page={page}
            pageCount={report?.pagination.totalPages ?? 0}
            onChange={setPage}
            className="py-4 border-t border-[#222]"
          />
        </>
      )}
    </div>
  );
}
