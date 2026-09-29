"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import StatusPill from "@/components/common/status-pill";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type {
  ScorekeeperPoolMember,
  ScorekeeperPoolResponse,
  ScorekeeperStatus,
} from "@/utils/types/scorekeeper";
import InviteScorekeeperModal from "@/components/scorekeepers/InviteScorekeeperModal";
import ConfirmActionModal, {
  type ScorekeeperAction,
} from "@/components/scorekeepers/ConfirmActionModal";

// ─── Filters & status presentation ──────────────────────────────────────────────

// "" = no ?status= param → all pool members.
const STATUS_FILTERS: { value: "" | ScorekeeperStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "INVITED", label: "Invited" },
  { value: "REQUESTED", label: "Requested" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVOKED", label: "Revoked" },
];

const STATUS_STYLE: Record<ScorekeeperStatus, { color: string; label: string }> = {
  INVITED: { color: "bg-yellow-400", label: "Invited" },
  REQUESTED: { color: "bg-blue-400", label: "Requested" },
  ACTIVE: { color: "bg-green-400", label: "Active" },
  REJECTED: { color: "bg-red-400", label: "Rejected" },
  REVOKED: { color: "bg-white/30", label: "Revoked" },
};

// ─── Row value helpers (org-invited vs fan-requested rows differ in shape) ────────

function getName(m: ScorekeeperPoolMember): string {
  return m.fan?.name?.trim() || "—";
}

function getEmail(m: ScorekeeperPoolMember): string {
  return m.fan?.email || m.email || "—";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function ScorekeepersPage() {
  const [statusFilter, setStatusFilter] = useState<"" | ScorekeeperStatus>("");
  const [rows, setRows] = useState<ScorekeeperPoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showInvite, setShowInvite] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ScorekeeperPoolMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<ScorekeeperAction>("accept");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    apiCall<ScorekeeperPoolResponse>({
      endpoint: routes.api.proxyListScorekeeperPool,
      method: "GET",
      data: statusFilter ? { status: statusFilter } : {},
    }).then((result) => {
      if (cancelled) return;
      const list = result.success && Array.isArray(result.data?.data) ? result.data.data : [];
      setRows(list);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, refreshKey]);

  const openConfirm = (member: ScorekeeperPoolMember, action: ScorekeeperAction) => {
    setConfirmAction(action);
    setConfirmTarget(member);
  };

  const columns: Column<ScorekeeperPoolMember>[] = [
    { header: "Name", cls: "flex-1", cell: (m) => getName(m) },
    { header: "Email", cls: "flex-1", cell: (m) => getEmail(m) },
    {
      header: "Status",
      cls: "w-32",
      cell: (m) => {
        const style = STATUS_STYLE[m.status];
        return <StatusPill label={style?.label ?? m.status} color={style?.color ?? "bg-white/30"} />;
      },
    },
    { header: "Date", cls: "w-32", cell: (m) => formatDate(m.respondedAt ?? m.invitedAt) },
    {
      header: "Actions",
      cls: "w-44 justify-center",
      cell: (m) =>
        m.status === "REQUESTED" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openConfirm(m, "accept")}
              className="h-8 px-3 rounded-lg bg-green-500/20 text-green-300 text-xs font-semibold hover:bg-green-500/30 transition-colors"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => openConfirm(m, "reject")}
              className="h-8 px-3 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-white/30">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: title + Add */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-white/60 text-sm">
          Manage the fans eligible to keep score for your games.
        </p>
        <Button
          label="Add"
          variant="cta"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowInvite(true)}
        />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "h-10 px-4 rounded-lg outline outline-1 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 outline-white/40 text-white"
                  : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl">
        <GenericTable
          columns={columns}
          rows={rows}
          getKey={(m) => m.id}
          loading={loading}
          empty={
            statusFilter
              ? "No scorekeepers match this filter."
              : "No scorekeepers yet. Invite a fan to get started."
          }
        />
      </div>

      <InviteScorekeeperModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={refresh}
      />
      <ConfirmActionModal
        target={confirmTarget}
        action={confirmAction}
        onClose={() => setConfirmTarget(null)}
        onDone={refresh}
      />
    </div>
  );
}
