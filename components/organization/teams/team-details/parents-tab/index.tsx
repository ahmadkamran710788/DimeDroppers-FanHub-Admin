"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import InvitePlayerModal from "@/components/organization/teams/invite-player-modal";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import ParentModal from "@/components/organization/teams/team-details/parent-modal";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import type { RosterParent, RosterPlayer } from "@/components/organization/teams/team-details/use-team-players";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

type Confirm = { kind: "withdraw" | "remove"; parent: RosterParent };

const search = (p: RosterParent) => [p.name, p.email, p.player];

// Invite until the parent is on Fan Hub or has an invitation pending; a pending one can be withdrawn.
const canInvite = (p: RosterParent) => p.invitationStatus !== "ACTIVE" && p.invitationStatus !== "INVITED";
const isPending = (p: RosterParent) => p.invitationStatus === "INVITED";

interface ParentsTabProps {
  // The school team (its schoolTeamId).
  teamId: string;
  rows: RosterParent[];
  // The team's players, to choose whose parent a new one is.
  players: RosterPlayer[];
  loading: boolean;
  // Refetches the roster after a change.
  reload: () => void;
}

// Team Details → Parents: Invite Parent (adds the parent under a player and emails the invitation), and
// Invite / Withdraw Invite / Edit / Remove on each row.
export default function ParentsTab({ teamId, rows, players, loading, reload }: ParentsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RosterParent | null>(null);
  const [inviting, setInviting] = useState<RosterParent | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const runConfirm = async ({ kind, parent }: Confirm) => {
    const result = await apiCall({
      endpoint:
        kind === "withdraw"
          ? routes.api.rosterSchoolParentInvite(teamId, parent.playerId, parent.id)
          : routes.api.rosterSchoolParent(teamId, parent.playerId, parent.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: kind === "withdraw" ? "Invitation withdrawn" : `${parent.name} removed`,
    });
    if (result.success) reload();
    return result.success;
  };

  const columns = useMemo<Column<RosterParent>[]>(() => {
    const actionsFor = (p: RosterParent): RowAction[] => [
      ...(canInvite(p)
        ? [{ label: p.invitationStatus === "NONE" ? "Invite" : "Invite Again", onSelect: () => setInviting(p) }]
        : []),
      ...(isPending(p) ? [{ label: "Withdraw Invite", onSelect: () => setConfirm({ kind: "withdraw", parent: p }) }] : []),
      {
        label: "Edit",
        onSelect: () => {
          setEditing(p);
          setFormOpen(true);
        },
      },
      { label: "Remove", variant: "destructive", onSelect: () => setConfirm({ kind: "remove", parent: p }) },
    ];
    return [
      { header: "Parent", cls: "flex-1 min-w-[200px] py-5", cell: (p) => <PersonCell name={p.name} email={p.email} /> },
      { header: "Player", cls: "w-44 shrink-0 py-5", cell: (p) => <span className="leading-5">{p.player}</span> },
      { header: "Phone", cls: "w-36 shrink-0 py-5 whitespace-nowrap", cell: (p) => p.phone || "—" },
      {
        header: "Status",
        cls: "w-28 shrink-0 py-5",
        cell: (p) => <StatusPill label={p.status} color={invitationColor(p.status)} className="whitespace-nowrap" />,
      },
      {
        header: "",
        cls: "w-14 shrink-0 py-5 flex justify-end",
        cell: (p) => <RowActionsMenu items={actionsFor(p)} ariaLabel={`Actions for ${p.name}`} />,
      },
    ];
  }, []);

  const confirmParent = confirm?.parent;

  return (
    <>
      <PeopleList
        rows={rows}
        loading={loading}
        columns={columns}
        getKey={(p) => p.id}
        searchFields={search}
        noun="parents"
        action={
          <Button
            variant="cta"
            label="Invite Parent"
            icon={<Plus className="size-5" strokeWidth={2} />}
            className="shrink-0"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />

      {/* Mounted per open so an edit starts from the parent it was opened for. */}
      {formOpen && (
        <ParentModal onClose={() => setFormOpen(false)} teamId={teamId} players={players} parent={editing} onSaved={reload} />
      )}
      {inviting && (
        <InvitePlayerModal
          onClose={() => setInviting(null)}
          name={inviting.name}
          endpoint={routes.api.rosterSchoolParentInvite(teamId, inviting.playerId, inviting.id)}
          defaultEmail={inviting.email}
          onSent={reload}
        />
      )}

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "withdraw" ? "Withdraw Invitation" : "Remove Parent"}
        message={
          confirm?.kind === "withdraw"
            ? `${confirmParent?.name} will no longer be able to accept the invitation. You can invite them again later.`
            : confirmParent?.invitationStatus === "ACTIVE"
              ? `${confirmParent.name} will be removed from ${confirmParent.player}'s parents and lose parent access to this team in the Fan Hub app.`
              : `${confirmParent?.name} will be removed from ${confirmParent?.player}'s parents${
                  confirmParent && isPending(confirmParent) ? " and their pending invitation withdrawn" : ""
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
