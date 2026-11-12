"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { CATEGORY_COLORS, CATEGORY_LABELS, KIND_COLOR, KIND_LABEL } from "@/components/sponsor/find-organizations/data";
import { storeNames } from "@/components/sponsor/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { PackageActivation, PackageActivationStatus } from "@/utils/types/sponsor-packages";

const STATUS: Record<PackageActivationStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-success" },
  EXPIRED: { label: "Expired", color: "bg-white/30" },
  CANCELLED: { label: "Cancelled", color: "bg-error/70" },
  PENDING_PAYMENT: { label: "Awaiting payment", color: "bg-[#f0c36a]" },
  PAYMENT_FAILED: { label: "Payment failed", color: "bg-error/70" },
};

const ACTION_BUTTON = cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm");

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// How it was paid, and the colour to show it in; null from an older API.
function paymentLine(a: PackageActivation): { text: string; className: string } | null {
  const p = a.payment;
  if (!p) return null;
  const refunded = p.refundedCents > 0 ? ` · Refunded ${formatCents(p.refundedCents, a.currency)}` : "";
  switch (p.state) {
    case "PAID":
      return {
        text: `Paid${p.methodLabel ? ` with ${p.methodLabel}` : ""}${p.paidAt ? ` · ${fmtDate(p.paidAt)}` : ""}${refunded}`,
        className: "text-[#a8a8a8]",
      };
    case "PROCESSING":
      return {
        text: `Bank payment${p.methodLabel ? ` with ${p.methodLabel}` : ""} clearing; it goes live when it clears (about 4 business days)`,
        className: "text-[#f0c36a]",
      };
    case "PENDING":
      return { text: "Waiting for your payment. Finish it or cancel it here.", className: "text-[#f0c36a]" };
    case "FAILED":
      return { text: "The payment didn't go through; nothing was charged.", className: "text-[#ff8a8d]" };
    case "CANCELLED":
      return { text: "Not paid; nothing was charged.", className: "text-[#a8a8a8]" };
    case "NOT_CHARGED":
      return { text: `Not charged (activated before payments)${refunded}`, className: "text-[#a8a8a8]" };
    case "FREE":
      return { text: "Free", className: "text-[#a8a8a8]" };
  }
}

// Only one that was never charged can be cancelled (a paid one can't; a waiting one cancels its payment).
const canCancel = (a: PackageActivation) =>
  a.status === "ACTIVE" && (!a.payment || a.payment.state === "NOT_CHARGED" || a.payment.state === "FREE");

// When it started (or was ordered, until paid), and when it ends, ended or was cancelled.
function dates(a: PackageActivation) {
  if (a.status === "PENDING_PAYMENT" || a.status === "PAYMENT_FAILED") return `Ordered ${fmtDate(a.activatedAt)}`;
  const parts = [`Activated ${fmtDate(a.activatedAt)}`];
  if (a.status === "CANCELLED") {
    if (a.cancelledAt) parts.push(`Cancelled ${fmtDate(a.cancelledAt)}`);
  } else if (a.status === "EXPIRED") {
    const ended = a.endsAt ?? a.expiredAt;
    if (ended) parts.push(`Ended ${fmtDate(ended)}`);
  } else {
    parts.push(a.endsAt ? `Ends ${fmtDate(a.endsAt)}` : "No end date");
  }
  return parts.join(" · ");
}

interface SponsorshipRowProps {
  activation: PackageActivation;
  onCancel: () => void;
  // A payment still waiting for the sponsor: finish it (Stripe's form or check) or cancel it.
  onFinishPayment: (paymentId: string) => void;
  onCancelPayment: (paymentId: string) => void;
}

// One of the sponsor's activations: what it is, where, its status, dates, price and payment, Cancel while
// it's active and was never charged (Finish / Cancel payment while its payment waits), and for a package the
// placements it includes (names only; sponsors see the total).
export default function SponsorshipRow({ activation: a, onCancel, onFinishPayment, onCancelPayment }: SponsorshipRowProps) {
  const [showPlacements, setShowPlacements] = useState(false);
  const status = STATUS[a.status];
  const hasPlacements = a.kind === "PACKAGE" && a.lines.length > 0;
  const payment = paymentLine(a);
  const waitingPaymentId = a.payment?.state === "PENDING" ? a.payment.paymentId : null;
  const cancellable = canCancel(a);

  return (
    <article
      aria-label={a.packageName}
      className="rounded-[12px] border border-[#262626] bg-[#0b0b0b] p-3 sm:p-4 flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <OrgMonogram logoUrl={a.organization.logoUrl} size="md" />
        <div className="flex-[1_1_220px] min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-semibold break-words">{a.packageName}</h4>
            <span className="text-[11px] font-bold tracking-[1px] uppercase" style={{ color: KIND_COLOR[a.kind] }}>
              {[KIND_LABEL[a.kind], a.physicalAsset?.assetCategory?.label, a.physicalAsset?.size].filter(Boolean).join(" · ")}
            </span>
          </div>
          <p className="text-[13px] text-[#a8a8a8] break-words">
            {[a.organization.name ?? "Unnamed organization", a.event?.name].filter(Boolean).join(" · ")}
          </p>
          {a.locations.length > 0 && (
            <p className="text-[13px] text-[#c9b8ff] break-words">{`For: ${storeNames(a.locations)}`}</p>
          )}
          <p className="text-[13px] text-[#a8a8a8]">{dates(a)}</p>
          {payment && <p className={cn("text-[13px] break-words", payment.className)}>{payment.text}</p>}
          {(a.status === "CANCELLED" || a.status === "PAYMENT_FAILED") && a.cancelReason && (
            <p className="text-[13px] text-[#c4c4c4] break-words">{`Reason: ${a.cancelReason}`}</p>
          )}
        </div>
        <StatusPill label={status.label} color={status.color} className="px-2" textClassName="text-white" />
        <span className="text-[15px] font-bold whitespace-nowrap">{formatCents(a.totalCents, a.currency)}</span>
        {(hasPlacements || cancellable || waitingPaymentId) && (
          <div className="flex flex-wrap gap-2">
            {hasPlacements && (
              <Button
                label={showPlacements ? "Hide placements" : "Placements"}
                onClick={() => setShowPlacements((v) => !v)}
                aria-expanded={showPlacements}
                className={ACTION_BUTTON}
              />
            )}
            {cancellable && <Button label="Cancel" onClick={onCancel} className={ACTION_BUTTON} />}
            {waitingPaymentId && (
              <>
                <Button
                  label="Finish payment"
                  onClick={() => onFinishPayment(waitingPaymentId)}
                  className={cn(ACTION_BUTTON, "bg-[#6a4be6] border-[#6a4be6] font-semibold")}
                />
                <Button label="Cancel payment" onClick={() => onCancelPayment(waitingPaymentId)} className={ACTION_BUTTON} />
              </>
            )}
          </div>
        )}
      </div>

      {showPlacements && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-1.5">
          {a.lines.map((l) => (
            <li key={l.catalogKey} className="px-[10px] py-2 rounded-[8px] bg-[#1a1a1a] border border-[#2a2a2a]">
              <span
                className="block text-[11px] font-bold tracking-[1px] uppercase"
                style={{ color: CATEGORY_COLORS[l.category] ?? "#c4c4c4" }}
              >
                {CATEGORY_LABELS[l.category] ?? l.category}
              </span>
              <span className="block text-[13px] leading-[1.35] mt-[2px]">{l.name}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
