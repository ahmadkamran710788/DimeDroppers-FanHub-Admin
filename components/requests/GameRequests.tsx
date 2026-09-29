"use client";

import { useCallback, useEffect, useState } from "react";
import FilterChips, { type FilterChipOption } from "@/components/common/filter-chips";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import StatusPill from "@/components/common/status-pill";
import type { GameRequestConfig } from "@/components/requests/config";
import ReviewRequestModal, { type ReviewAction } from "@/components/requests/ReviewRequestModal";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import type { GameRequest, GameRequestStatus, GameRequestsResponse } from "@/utils/types/game-request";

const PAGE_SIZE = 20;

const STATUS_FILTERS: FilterChipOption<GameRequestStatus>[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLE: Record<GameRequestStatus, { color: string; label: string }> = {
  PENDING: { color: "bg-blue-400", label: "Pending" },
  ACCEPTED: { color: "bg-green-400", label: "Accepted" },
  REJECTED: { color: "bg-red-400", label: "Rejected" },
};

const ACTION_BTN = "h-8 px-3 rounded-lg text-xs font-semibold transition-colors";

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

interface GameRequestsProps {
  config: GameRequestConfig;
  // Reports the school's pending count (for the tab badge).
  onPendingCount?: (count: number) => void;
}

// Per-game request queue: a fan asks to be a game's official scorekeeper / videographer;
// the org accepts or rejects. Shared by both roles — only `config` differs.
export default function GameRequests({ config, onPendingCount }: GameRequestsProps) {
  const [status, setStatus] = useState<GameRequestStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<GameRequest[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [target, setTarget] = useState<GameRequest | null>(null);
  const [action, setAction] = useState<ReviewAction>("accept");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    apiCall<GameRequestsResponse>({
      endpoint: config.endpoints.list,
      method: "GET",
      data: { status, page, limit: PAGE_SIZE },
    }).then((result) => {
      if (cancelled) return;
      const payload = result.success ? result.data?.data?.[0] : undefined;
      setRows(payload?.items ?? []);
      setPageCount(payload?.pagination?.totalPages || 1);
      if (payload) onPendingCount?.(payload.pendingCount);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [config.endpoints.list, status, page, refreshKey, onPendingCount]);

  const review = (request: GameRequest, next: ReviewAction) => {
    setAction(next);
    setTarget(request);
  };

  const columns: Column<GameRequest>[] = [
    {
      header: "Fan",
      cls: "flex-1 min-w-[180px]",
      cell: (r) => (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate">{r.fan.name?.trim() || "—"}</span>
            {r.inPool && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-medium">In pool</span>
            )}
          </span>
          <span className="text-white/40 truncate">{r.fan.email || "—"}</span>
        </div>
      ),
    },
    {
      header: "Game",
      cls: "flex-1 min-w-[200px]",
      cell: (r) => (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{r.game.title}</span>
          <span className="text-white/40 truncate">
            {[r.game.sport, r.game.gender, fmtDateTime(r.game.utcTime)].filter(Boolean).join(" · ")}
          </span>
        </div>
      ),
    },
    {
      header: "Message",
      cls: "w-48",
      cell: (r) => (
        <span className="line-clamp-2 leading-4 text-white/80">{r.message?.trim() || "—"}</span>
      ),
    },
    { header: "Requested", cls: "w-36", cell: (r) => fmtDateTime(r.createdAt) },
    {
      header: status === "PENDING" ? "Actions" : "Decision",
      cls: "w-44 justify-center",
      cell: (r) =>
        r.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => review(r, "accept")}
              className={cn(ACTION_BTN, "bg-green-500/20 text-green-300 hover:bg-green-500/30")}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => review(r, "reject")}
              className={cn(ACTION_BTN, "bg-red-500/20 text-red-300 hover:bg-red-500/30")}
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 min-w-0">
            <StatusPill label={STATUS_STYLE[r.status].label} color={STATUS_STYLE[r.status].color} />
            {r.reviewNote && <span className="text-white/60 truncate max-w-full">{r.reviewNote}</span>}
          </div>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <FilterChips
        options={STATUS_FILTERS}
        value={status}
        onChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
      />

      <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
        <GenericTable
          columns={columns}
          rows={rows}
          getKey={(r) => r.id}
          loading={loading}
          empty={
            status === "PENDING"
              ? `No pending ${config.role.toLowerCase()} requests.`
              : `No ${STATUS_STYLE[status].label.toLowerCase()} requests yet.`
          }
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} className="self-end" />
      </div>

      <ReviewRequestModal config={config} target={target} action={action} onClose={() => setTarget(null)} onDone={refresh} />
    </div>
  );
}
