"use client";

import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import StatusPill from "@/components/common/status-pill";
import { ORDER_STATUS } from "@/components/organization/buy-tickets/order-status";
import { formatMoney } from "@/utils/helper";
import type { TicketOrder } from "@/utils/types/tickets";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const fmtGame = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// One label / amount line of the totals.
function Row({ label, amount, strong = false }: { label: string; amount: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 text-base font-semibold text-midnight-navy" : "flex justify-between gap-4 text-sm text-midnight-navy/70"}>
      <span>{label}</span>
      <span className="shrink-0">{amount}</span>
    </div>
  );
}

// An order's receipt: who bought, the campaign, each ticket line, then subtotal, Dimes and total.
export default function OrderReceiptModal({ order, onClose }: { order: TicketOrder; onClose: () => void }) {
  const status = ORDER_STATUS[order.status];
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Order Details"
      className="max-w-[min(520px,calc(100vw-2rem))] items-stretch max-h-[calc(100dvh-2rem)] overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6"
    >
      <div className="w-full flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto overscroll-contain pr-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-base font-semibold text-midnight-navy truncate">{order.holderName || "Guest"}</span>
            <span className="text-sm text-midnight-navy/60 truncate">{order.holderEmail || "No email"}</span>
            {order.campaignTitle && <span className="text-xs text-midnight-navy/60 truncate">{order.campaignTitle}</span>}
            <span className="text-xs text-midnight-navy/50 mt-1">
              {order.paidAt ? `Paid ${fmtDateTime(order.paidAt)}` : `Started ${fmtDateTime(order.createdAt)}`}
            </span>
          </div>
          <StatusPill label={status.label} color={status.color} className="shrink-0" />
        </div>

        <div className="flex flex-col rounded-[12px] border border-[rgba(11,28,45,0.12)] divide-y divide-[rgba(11,28,45,0.08)]">
          {order.lines.length === 0 && <p className="px-4 py-3 text-sm text-midnight-navy/60">No ticket lines recorded.</p>}
          {order.lines.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-midnight-navy">{`${l.quantity}× ${l.titleSnapshot}`}</span>
                {l.scheduleEvent && (
                  <span className="text-xs text-midnight-navy/60 truncate">
                    {`${l.scheduleEvent.opponent ? `vs ${l.scheduleEvent.opponent}` : l.scheduleEvent.title} · ${fmtGame(l.scheduleEvent.start)}`}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm text-midnight-navy">{formatMoney(l.unitPrice * l.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Row label="Subtotal" amount={formatMoney(order.subtotal)} />
          {order.dimesDiscount > 0 && (
            <Row label={`Dimes (${order.dimesApplied.toLocaleString("en-US")})`} amount={`−${formatMoney(order.dimesDiscount)}`} />
          )}
          <div className="h-px bg-[rgba(11,28,45,0.12)] my-1" />
          <Row label="Total" amount={formatMoney(order.total)} strong />
          <span className="text-xs text-midnight-navy/50">{`${order.ticketsIssued} ${order.ticketsIssued === 1 ? "ticket" : "tickets"} issued`}</span>
        </div>
      </div>

      <Button label="Close" variant="secondary" onClick={onClose} fullWidth />
    </Modal>
  );
}
