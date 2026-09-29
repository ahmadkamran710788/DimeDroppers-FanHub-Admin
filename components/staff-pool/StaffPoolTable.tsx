"use client";

import GenericTable, { type Column } from "@/components/common/generic-table";
import StatusPill from "@/components/common/status-pill";
import type { StaffPoolAction } from "@/components/staff-pool/ConfirmActionModal";
import { cn } from "@/utils/cn";
import type { StaffPoolMember, StaffPoolStatus } from "@/utils/types/staff-pool";

export const STATUS_STYLE: Record<StaffPoolStatus, { color: string; label: string }> = {
  INVITED: { color: "bg-yellow-400", label: "Invited" },
  REQUESTED: { color: "bg-blue-400", label: "Requested" },
  ACTIVE: { color: "bg-green-400", label: "Active" },
  REJECTED: { color: "bg-red-400", label: "Rejected" },
  REVOKED: { color: "bg-white/30", label: "Revoked" },
};

// ─── Row value helpers (org-invited vs fan-requested rows differ in shape) ────────

function getName(m: StaffPoolMember): string {
  return m.fan?.name?.trim() || "—";
}

function getEmail(m: StaffPoolMember): string {
  return m.fan?.email || m.email || "—";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ACTION_BTN = "h-8 px-3 rounded-lg text-xs font-semibold transition-colors";

interface StaffPoolTableProps {
  rows: StaffPoolMember[];
  loading?: boolean;
  empty: string;
  onAction: (member: StaffPoolMember, action: StaffPoolAction) => void;
  // Show Revoke on ACTIVE rows (only when the pool has a revoke endpoint).
  canRevoke?: boolean;
}

// Staff pool members table (name, email, status, date, actions). Used by the pool pages
// and the Requests page.
export default function StaffPoolTable({ rows, loading = false, empty, onAction, canRevoke = false }: StaffPoolTableProps) {
  const columns: Column<StaffPoolMember>[] = [
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
              onClick={() => onAction(m, "accept")}
              className={cn(ACTION_BTN, "bg-green-500/20 text-green-300 hover:bg-green-500/30")}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onAction(m, "reject")}
              className={cn(ACTION_BTN, "bg-red-500/20 text-red-300 hover:bg-red-500/30")}
            >
              Reject
            </button>
          </div>
        ) : m.status === "ACTIVE" && canRevoke ? (
          <button
            type="button"
            onClick={() => onAction(m, "revoke")}
            className={cn(ACTION_BTN, "bg-red-500/20 text-red-300 hover:bg-red-500/30")}
          >
            Revoke
          </button>
        ) : (
          <span className="text-white/30">—</span>
        ),
    },
  ];

  return (
    <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl">
      <GenericTable columns={columns} rows={rows} getKey={(m) => m.id} loading={loading} empty={empty} />
    </div>
  );
}
