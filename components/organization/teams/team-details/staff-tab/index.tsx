"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import AddStaffModal from "@/components/organization/teams/team-details/add-staff-modal";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import type { TeamStaffMember } from "@/components/organization/teams/team-details/use-team-staff";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

type Confirm = { kind: "withdraw" | "remove"; member: TeamStaffMember };

const staffSearch = (s: TeamStaffMember) => [s.name, s.email, s.role];

// Inviting is allowed until the first invitation, and again after a decline, a withdrawal
// or the 7-day expiry. A pending (unexpired) invitation can be withdrawn instead.
const canInvite = (s: TeamStaffMember) => s.invitationStatus !== "ACTIVE" && (s.invitationStatus !== "INVITED" || s.invitationExpired);
const isPending = (s: TeamStaffMember) => s.invitationStatus === "INVITED" && !s.invitationExpired;

interface StaffTabProps {
  teamId: string;
  staff: TeamStaffMember[];
  loading: boolean;
  // Refetches the staff list after a change.
  reload: () => void;
}

// The Staff tab: the team's coaches with Invite / Withdraw / Edit / Remove on each row.
export default function StaffTab({ teamId, staff, loading, reload }: StaffTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamStaffMember | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const openForm = (member: TeamStaffMember | null) => {
    setEditing(member);
    setFormOpen(true);
  };

  // apiCall toasts failures (e.g. 409 already invited) itself.
  const invite = async (s: TeamStaffMember) => {
    if (!s.email) {
      toast.error("Add an email address to this staff member before inviting them");
      openForm(s);
      return;
    }
    const result = await apiCall({
      endpoint: routes.api.rosterStaffInvite(s.id),
      method: "POST",
      invalidates: [routes.api.rosterStaff],
      showSuccessToast: true,
      successMessage: `Invitation sent to ${s.email}`,
    });
    if (result.success) reload();
  };

  const runConfirm = async ({ kind, member }: Confirm) => {
    const result = await apiCall({
      endpoint: kind === "withdraw" ? routes.api.rosterStaffInvite(member.id) : routes.api.rosterStaffMember(member.id),
      method: "DELETE",
      invalidates: [routes.api.rosterStaff],
      showSuccessToast: true,
      successMessage: kind === "withdraw" ? "Invitation withdrawn" : `${member.name} removed from staff`,
    });
    if (result.success) reload();
    return result.success;
  };

  const columns = useMemo<Column<TeamStaffMember>[]>(() => {
    const actionsFor = (s: TeamStaffMember): RowAction[] => [
      ...(canInvite(s)
        ? [{ label: s.invitationStatus === "NONE" ? "Invite" : "Resend Invite", onSelect: () => void invite(s) }]
        : []),
      ...(isPending(s) ? [{ label: "Withdraw Invite", onSelect: () => setConfirm({ kind: "withdraw", member: s }) }] : []),
      { label: "Edit", onSelect: () => openForm(s) },
      { label: "Remove", variant: "destructive", onSelect: () => setConfirm({ kind: "remove", member: s }) },
    ];
    return [
      { header: "Name", cls: "flex-1 min-w-[200px] py-5", cell: (s) => <PersonCell name={s.name} email={s.email} /> },
      { header: "Role", cls: "w-40 shrink-0 py-5", cell: (s) => <span className="leading-5">{s.role}</span> },
      { header: "Phone", cls: "w-36 shrink-0 py-5", cell: (s) => s.phone || "—" },
      {
        header: "Status",
        cls: "w-28 shrink-0 py-5",
        cell: (s) => <StatusPill label={s.status} color={invitationColor(s.status)} className="whitespace-nowrap" />,
      },
      {
        header: "",
        cls: "w-14 shrink-0 py-5 flex justify-end",
        cell: (s) => <RowActionsMenu items={actionsFor(s)} ariaLabel={`Actions for ${s.name}`} />,
      },
    ];
    // invite/openForm only close over stable setters and props that `reload` covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const confirmMember = confirm?.member;

  return (
    <>
      <PeopleList
        rows={staff}
        loading={loading}
        columns={columns}
        getKey={(s) => s.id}
        searchFields={staffSearch}
        noun="staff"
        action={
          <Button
            variant="cta"
            label="Add Staff"
            icon={<Plus className="size-5" strokeWidth={2} />}
            className="shrink-0"
            onClick={() => openForm(null)}
          />
        }
      />

      {/* Mounted per open so an edit starts from the entry it was opened for. */}
      {formOpen && (
        <AddStaffModal
          isOpen
          onClose={() => setFormOpen(false)}
          teamId={teamId}
          member={editing}
          onSaved={(name) => {
            reload();
            toast.success(editing ? `${name} updated` : `${name} added to staff`);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "withdraw" ? "Withdraw Invitation" : "Remove Staff"}
        message={
          confirm?.kind === "withdraw"
            ? `${confirmMember?.name} will no longer be able to accept the invitation. You can invite them again later.`
            : confirmMember?.invitationStatus === "ACTIVE"
              ? `${confirmMember.name} will be removed from the staff and lose coach access to this team in the Fan Hub app.`
              : `${confirmMember?.name} will be removed from the staff${
                  confirmMember && isPending(confirmMember) ? " and their pending invitation withdrawn" : ""
                }.`
        }
        confirmLabel={confirm?.kind === "withdraw" ? "Withdraw" : "Remove"}
        busyLabel={confirm?.kind === "withdraw" ? "Withdrawing…" : "Removing…"}
        destructive
        onConfirm={() => (confirm ? runConfirm(confirm) : Promise.resolve(false))}
      />
    </>
  );
}
