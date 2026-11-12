"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import { CARD, HINT_LINK, OUTLINE_BUTTON } from "@/components/sponsor/styles";
import { formatCents, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PaymentStatus, SponsorPayment, SponsorPaymentsPage } from "@/utils/types/sponsor-payments";

const PAGE_SIZE = 10;

const STATUS: Record<PaymentStatus, { label: string; color: string }> = {
  SUCCEEDED: { label: "Paid", color: "bg-success" },
  PROCESSING: { label: "Bank clearing", color: "bg-[#f0c36a]" },
  PENDING: { label: "Waiting", color: "bg-[#f0c36a]" },
  FAILED: { label: "Failed", color: "bg-error/70" },
  CANCELLED: { label: "Cancelled", color: "bg-white/30" },
};

const STATUS_OPTIONS = [
  { label: "All payments", value: "" },
  { label: "Paid", value: "SUCCEEDED" },
  { label: "Bank clearing", value: "PROCESSING" },
  { label: "Waiting", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// The line under a payment: what it paid for, with what, and how it ended.
function details(p: SponsorPayment) {
  const count = p.orderIds.length;
  return [
    `${count} sponsorship${count === 1 ? "" : "s"}`,
    p.methodLabel ?? (p.status === "SUCCEEDED" ? null : "New payment method"),
    p.paidAt && `Paid ${fmtDateTime(p.paidAt)}`,
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

// Every payment the sponsor made for activations (GET /payments), newest first, by status. A single
// activation and a whole cart are one payment each.
export default function PaymentHistory() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);

  const key = `${status}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorPaymentsPage>("GET", routes.api.sponsorPayments, {
      params: { status: status || undefined, page, limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, page: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, status, page]);

  const current = list?.key === key ? list : null;
  const items = current?.page?.items ?? [];

  return (
    <section aria-label="Payment history" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          label="Status"
          name="paymentStatus"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          variant="dark"
          className="w-full sm:w-[240px]"
        />
        <p className="text-[13px] text-[#a8a8a8]">
          A waiting payment can be finished or cancelled in{" "}
          <Link href={routes.ui.sponsor.mySponsorships} className={HINT_LINK}>
            My Sponsorships
          </Link>
          .
        </p>
      </div>

      {!current ? (
        <Loader />
      ) : current.error ? (
        <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
          <p className="text-sm text-[#f0c36a]">{`Couldn't load your payments: ${current.error}`}</p>
          <Button
            label="Retry"
            onClick={() => setReloads((n) => n + 1)}
            className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
          />
        </div>
      ) : items.length === 0 ? (
        <div className={cn(CARD, "rounded-[8px] p-6")}>
          <p className="text-[15px] text-[#a8a8a8]">
            {status ? "No payments with this status." : "You haven't paid for a sponsorship yet."}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((p) => {
              const s = STATUS[p.status];
              return (
                <li
                  key={p.id}
                  className="rounded-[12px] border border-[#262626] bg-[#0b0b0b] p-3 sm:p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-[1_1_240px] min-w-0 flex flex-col gap-1">
                    <span className="text-[15px] font-semibold">{fmtDateTime(p.createdAt)}</span>
                    <span className="text-[13px] text-[#a8a8a8] break-words">{details(p)}</span>
                    {p.failureReason && p.status !== "SUCCEEDED" && (
                      <span className="text-[13px] text-[#ff8a8d] break-words">{p.failureReason}</span>
                    )}
                  </div>
                  <StatusPill label={s.label} color={s.color} className="px-2" textClassName="text-white" />
                  <span className="text-[15px] font-bold whitespace-nowrap">{formatCents(p.amountCents, p.currency)}</span>
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
