"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import { HINT_LINK } from "@/components/sponsor/styles";
import {
  PANEL,
  PAYMENT_STATUS,
  SECTION_HEADING,
  SMALL_OUTLINE_BUTTON,
} from "@/components/sponsor/billing-info/data";
import { formatCents, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageActivation, PackageActivationsPage } from "@/utils/types/sponsor-packages";
import type { SponsorPayment, SponsorPaymentsPage } from "@/utils/types/sponsor-payments";

const PAGE_SIZE = 10;
// The newest activations, to name what each payment bought (the payments API only has their ids).
const NAMES_LIMIT = 100;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// "Fan Engagement Partner · Abbeville High School", "… and 2 more" for a cart, or "3 sponsorships" when the
// activations aren't among the newest ones loaded.
function titleOf(p: SponsorPayment, byId: Map<string, PackageActivation>): string {
  const count = p.orderIds.length;
  const first = p.orderIds.map((id) => byId.get(id)).find(Boolean);
  if (!first) return `${count} sponsorship${count === 1 ? "" : "s"}`;
  const name = [first.packageName, first.organization.name].filter(Boolean).join(" · ");
  return count > 1 ? `${name} and ${count - 1} more` : name;
}

// The grey line under a payment: its date, how it was paid and any refund.
function metaOf(p: SponsorPayment): string {
  return [
    fmtDate(p.paidAt ?? p.createdAt),
    p.methodLabel ?? "New payment method",
    p.refundedCents > 0 && `Refunded ${formatCents(p.refundedCents, p.currency)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

interface Loaded {
  key: string;
  page?: SponsorPaymentsPage;
  error?: string;
}

// Every payment the sponsor made for activations (GET /payments), newest first. A single activation and a
// whole cart are one payment each. There are no receipts in the API yet, so Receipt is "Coming soon".
export default function BillingHistory() {
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);
  const [names, setNames] = useState<Map<string, PackageActivation>>(() => new Map());

  const key = `${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorPaymentsPage>("GET", routes.api.sponsorPayments, {
      params: { page, limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, page: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, page]);

  // Once: if it fails, the rows just count their sponsorships.
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<PackageActivationsPage>("GET", routes.api.sponsorActivations, {
      params: { page: 1, limit: NAMES_LIMIT },
    }).then((r) => {
      if (!cancelled && r.view) setNames(new Map(r.view.items.map((a) => [a.id, a])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = list?.key === key ? list : null;
  const items = current?.page?.items ?? [];

  return (
    <section aria-labelledby="billing-history-title" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="billing-history-title" className={SECTION_HEADING}>
          Billing history
        </h3>
        <p className="text-[13px] text-[#a1a1aa]">
          Finish or cancel a waiting payment in{" "}
          <Link href={routes.ui.sponsor.mySponsorships} className={HINT_LINK}>
            My Sponsorships
          </Link>
          .
        </p>
      </div>

      {!current ? (
        <Loader />
      ) : current.error ? (
        <div className={cn(PANEL, "p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3")}>
          <p className="text-sm text-[#f0c36a]">{`Couldn't load your payments: ${current.error}`}</p>
          <Button label="Retry" onClick={() => setReloads((n) => n + 1)} className={SMALL_OUTLINE_BUTTON} />
        </div>
      ) : items.length === 0 ? (
        <p className={cn(PANEL, "p-[22px] text-center text-[#a1a1aa]")}>You haven&apos;t paid for a sponsorship yet.</p>
      ) : (
        <>
          <ul className={cn(PANEL, "overflow-hidden flex flex-col")}>
            {items.map((p) => {
              const s = PAYMENT_STATUS[p.status];
              const title = titleOf(p, names);
              const date = fmtDate(p.paidAt ?? p.createdAt);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3.5 px-4 py-4 sm:px-5 border-b border-[#1e2026] last:border-b-0"
                >
                  <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1">
                    <span className="text-[15px] font-semibold break-words">{title}</span>
                    <span className="text-[13px] text-[#a1a1aa] break-words">{metaOf(p)}</span>
                    {p.failureReason && p.status !== "SUCCEEDED" && (
                      <span className="text-[13px] text-[#fca5a5] break-words">{p.failureReason}</span>
                    )}
                  </div>
                  <span className={cn("rounded-full px-2.5 py-[3px] text-xs font-bold tracking-[0.5px]", s.className)}>
                    {s.label}
                  </span>
                  <span className="ml-auto sm:ml-0 min-w-20 text-right font-display font-black text-[22px] leading-none tabular-nums">
                    {formatCents(p.amountCents, p.currency)}
                  </span>
                  <Button
                    label="Receipt"
                    aria-label={`Receipt for ${title}, ${date}`}
                    onClick={() => toast("Coming soon.")}
                    className={SMALL_OUTLINE_BUTTON}
                  />
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            <Pagination page={page} pageCount={current.page?.pagination.totalPages ?? 0} onChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
}
