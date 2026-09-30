"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import ConfirmActionModal, { type StaffPoolAction } from "@/components/staff-pool/confirm-action-modal";
import InviteMemberModal from "@/components/staff-pool/invite-member-modal";
import StaffPoolTable from "@/components/staff-pool/staff-pool-table";
import type { StaffPoolConfig } from "@/components/staff-pool/config";
import apiCall from "@/utils/api-call";
import type { StaffPoolMember, StaffPoolResponse, StaffPoolStatus } from "@/utils/types/staff-pool";

// ─── Filters & status presentation ──────────────────────────────────────────────

// "" = no ?status= param → all pool members.
const STATUS_FILTERS: { value: "" | StaffPoolStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "INVITED", label: "Invited" },
  { value: "REQUESTED", label: "Requested" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVOKED", label: "Revoked" },
];

// ─── Page ────────────────────────────────────────────────────────────────────────

interface StaffPoolPageProps {
  config: StaffPoolConfig;
}

// Staff pool list (invite, filter by status, accept / reject requests, revoke members).
// Shared by Score Keepers and Video Graphers — only `config` differs.
export default function StaffPoolPage({ config }: StaffPoolPageProps) {
  const [statusFilter, setStatusFilter] = useState<"" | StaffPoolStatus>("");
  const [rows, setRows] = useState<StaffPoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showInvite, setShowInvite] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<StaffPoolMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<StaffPoolAction>("accept");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const role = config.role.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    apiCall<StaffPoolResponse>({
      endpoint: config.endpoints.list,
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
  }, [config.endpoints.list, statusFilter, refreshKey]);

  const openConfirm = (member: StaffPoolMember, action: StaffPoolAction) => {
    setConfirmAction(action);
    setConfirmTarget(member);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: description + Add */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-white/60 text-sm">{config.description}</p>
        <Button label="Add" variant="cta" icon={<Plus className="w-5 h-5" />} onClick={() => setShowInvite(true)} />
      </div>

      {/* Status filter chips */}
      <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />

      {/* Table */}
      <StaffPoolTable
        rows={rows}
        loading={loading}
        onAction={openConfirm}
        canRevoke={!!config.endpoints.revoke}
        empty={statusFilter ? `No ${role}s match this filter.` : `No ${role}s yet. Invite a fan to get started.`}
      />

      <InviteMemberModal config={config} isOpen={showInvite} onClose={() => setShowInvite(false)} onInvited={refresh} />
      <ConfirmActionModal
        config={config}
        target={confirmTarget}
        action={confirmAction}
        onClose={() => setConfirmTarget(null)}
        onDone={refresh}
      />
    </div>
  );
}
