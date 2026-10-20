"use client";

import { useMemo, useRef, useState } from "react";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import OrderReceiptModal from "@/components/organization/buy-tickets/order-receipt-modal";
import { ORDER_STATUS } from "@/components/organization/buy-tickets/order-status";
import { useTicketOrders } from "@/components/organization/buy-tickets/use-ticket-orders";
import { formatMoney } from "@/utils/helper";
import type { TicketCampaign, TicketOrder, TicketOrderStatus } from "@/utils/types/tickets";

const PAGE_SIZE = 10;
// Wait this long after the last keystroke before searching the API.
const SEARCH_DELAY_MS = 300;
// Ticket lines shown in a row before "+N more".
const LINES_SHOWN = 2;

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const FILTER_LABEL = "text-xs font-medium text-white/60";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtGame = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// The Dimes that came off the order, e.g. "500 Dimes −$5".
const discountNote = (o: TicketOrder) =>
  o.dimesApplied > 0 ? `${o.dimesApplied.toLocaleString("en-US")} Dimes −${formatMoney(o.dimesDiscount)}` : "";

const columns: Column<TicketOrder>[] = [
  {
    header: "Buyer",
    cls: "w-56 shrink-0 py-5",
    cell: (o) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold text-white truncate">{o.holderName || "Guest"}</span>
        <span className="text-xs text-white/40 truncate">{o.holderEmail || "—"}</span>
      </div>
    ),
  },
  {
    header: "Tickets",
    cls: "flex-1 min-w-[240px] py-5",
    cell: (o) => (
      <div className="flex flex-col gap-1 min-w-0">
        {o.lines.length === 0 && <span className="text-white/40">—</span>}
        {o.lines.slice(0, LINES_SHOWN).map((l) => (
          <span key={l.id} className="text-sm text-white truncate">
            {`${l.quantity}× ${l.titleSnapshot}`}
            {l.scheduleEvent && (
              <span className="text-white/40">{` · ${l.scheduleEvent.opponent ? `vs ${l.scheduleEvent.opponent}` : l.scheduleEvent.title}, ${fmtGame(l.scheduleEvent.start)}`}</span>
            )}
          </span>
        ))}
        {o.lines.length > LINES_SHOWN && <span className="text-xs text-white/40">{`+${o.lines.length - LINES_SHOWN} more`}</span>}
      </div>
    ),
  },
  {
    header: "Total",
    cls: "w-44 shrink-0 py-5",
    cell: (o) => (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-white">{formatMoney(o.total)}</span>
        {discountNote(o) && <span className="text-xs text-white/40">{discountNote(o)}</span>}
      </div>
    ),
  },
  {
    header: "Status",
    cls: "w-28 shrink-0 py-5",
    cell: (o) => <StatusPill label={ORDER_STATUS[o.status].label} color={ORDER_STATUS[o.status].color} className="whitespace-nowrap" />,
  },
  { header: "Date", cls: "w-28 shrink-0 py-5", cell: (o) => fmtDate(o.paidAt ?? o.createdAt) },
];

interface OrdersTabProps {
  // For the Campaign and Game filters.
  campaigns: TicketCampaign[];
}

// The Orders tab of Buy Tickets: every ticket order, newest first, paged and filtered by the API.
// A row opens the order's receipt.
export default function OrdersTab({ campaigns }: OrdersTabProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | TicketOrderStatus>("");
  const [campaignId, setCampaignId] = useState("");
  const [scheduleEventId, setScheduleEventId] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<TicketOrder | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { orders, total, loading } = useTicketOrders({ page, limit: PAGE_SIZE, search, status, campaignId, scheduleEventId });

  const campaignOptions = useMemo(() => [{ label: "All", value: "" }, ...campaigns.map((c) => ({ label: c.title, value: c.id }))], [campaigns]);
  // Every game any campaign sells for, once each, by date.
  const gameOptions = useMemo(() => {
    const games = new Map(campaigns.flatMap((c) => c.games).map((g) => [g.id, g]));
    return [
      { label: "All", value: "" },
      ...[...games.values()]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((g) => ({ label: `${g.opponent ? `vs ${g.opponent}` : g.title} · ${fmtGame(g.start)}`, value: g.id })),
    ];
  }, [campaigns]);

  const onSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
  };

  // Every filter change starts again from page 1.
  const filter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const filtered = !!search || !!status || !!campaignId || !!scheduleEventId;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by name or email"
        aria-label="Search orders"
        className="lg:max-w-sm"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:max-w-3xl">
        <Select
          label="Status"
          name="orderStatus"
          variant="dark"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => filter(setStatus)(e.target.value as "" | TicketOrderStatus)}
          labelClassName={FILTER_LABEL}
        />
        <Select
          label="Campaign"
          name="orderCampaign"
          variant="dark"
          value={campaignId}
          options={campaignOptions}
          onChange={(e) => filter(setCampaignId)(e.target.value)}
          labelClassName={FILTER_LABEL}
        />
        <Select
          label="Game"
          name="orderGame"
          variant="dark"
          value={scheduleEventId}
          options={gameOptions}
          onChange={(e) => filter(setScheduleEventId)(e.target.value)}
          labelClassName={FILTER_LABEL}
        />
      </div>

      <div className="flex flex-col">
        <GenericTable
          columns={columns}
          rows={orders}
          getKey={(o) => o.id}
          loading={loading}
          onRowClick={setOpen}
          empty={filtered ? "No orders match your filters." : "No orders yet."}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
          <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${total} orders`}</span>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>

      {open && <OrderReceiptModal order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
