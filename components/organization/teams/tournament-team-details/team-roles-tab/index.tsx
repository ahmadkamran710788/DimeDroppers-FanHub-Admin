"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import InviteRoleModal, { playerName } from "@/components/organization/teams/tournament-team-details/invite-role-modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposurePlayer } from "@/utils/types/exposure-event";
import type { TeamRole, TeamRoleMember } from "@/utils/types/team-role";

const STAFF_ROLES: TeamRole[] = ["COACH", "SCOREKEEPER", "VIDEOGRAPHER"];
const ROLE_LABEL: Record<TeamRole, string> = {
  COACH: "Coach",
  SCOREKEEPER: "Scorekeeper",
  VIDEOGRAPHER: "Videographer",
  PLAYER: "Player",
  PARENT: "Parent",
};

interface Row {
  member: TeamRoleMember;
  name: string;
  email: string;
  role: string;
  player: string;
  status: string;
}

// "Expired" for an invitation past its 7 days; it can be sent again.
const statusOf = (m: TeamRoleMember) =>
  m.status === "INVITED"
    ? m.expiresAt && new Date(m.expiresAt).getTime() < Date.now()
      ? "Expired"
      : "Invited"
    : m.status === "REQUESTED"
      ? "Requested"
      : m.status === "ACTIVE"
        ? "Active"
        : "Declined";

// Someone can be invited again after a decline or once the invitation expired.
const canResend = (r: Row) => r.status === "Declined" || r.status === "Expired";

type Confirm = { kind: "remove" | "reject"; row: Row };

interface TeamRolesTabProps {
  kind: "staff" | "parent";
  fanHubTeamId: string;
  members: TeamRoleMember[];
  players: ExposurePlayer[];
  loading: boolean;
  reload: () => void;
}

// A tournament team's Staff or Parents tab, from the team-roles API: invite someone, accept or reject
// a fan's request to join, resend an expired or declined invitation, and remove an active member.
export default function TeamRolesTab({ kind, fanHubTeamId, members, players, loading, reload }: TeamRolesTabProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const rows = useMemo<Row[]>(() => {
    const names = new Map(players.map((p) => [p.id, playerName(p)]));
    return (
      members
        // Withdrawn and rejected rows are history.
        .filter((m) => m.status !== "REVOKED" && m.status !== "REJECTED")
        .filter((m) => (kind === "staff" ? STAFF_ROLES.includes(m.role) : m.role === "PARENT"))
        .map((m) => ({
          member: m,
          name: m.fan?.name || m.email,
          email: m.email,
          role: m.staffTitle ?? ROLE_LABEL[m.role],
          player: (m.fanHubPlayerId && names.get(m.fanHubPlayerId)) || "—",
          status: statusOf(m),
        }))
    );
  }, [members, players, kind]);

  const columns = useMemo<Column<Row>[]>(() => {
    // apiCall toasts failures itself.
    const post = async (endpoint: string, data: Record<string, unknown> | undefined, successMessage: string) => {
      const result = await apiCall({ endpoint, method: "POST", data, showSuccessToast: true, successMessage });
      if (result.success) reload();
    };
    // Re-inviting reuses the old row and emails a fresh link.
    const resend = (r: Row) =>
      post(
        routes.api.teamRoles,
        {
          email: r.email,
          fanHubTeamId,
          role: r.member.role,
          ...(r.member.staffTitle && { staffTitle: r.member.staffTitle === "Head Coach" ? "HEAD_COACH" : "ASSISTANT_COACH" }),
          ...(r.member.fanHubPlayerId && { fanHubPlayerId: r.member.fanHubPlayerId }),
        },
        `Invitation sent to ${r.email}`
      );
    const actionsFor = (r: Row): RowAction[] =>
      r.status === "Requested"
        ? [
            { label: "Accept", onSelect: () => void post(routes.api.acceptTeamRole(r.member.id), undefined, `${r.name} added to the team`) },
            { label: "Reject", variant: "destructive", onSelect: () => setConfirm({ kind: "reject", row: r }) },
          ]
        : r.status === "Active"
          ? [{ label: "Remove", variant: "destructive", onSelect: () => setConfirm({ kind: "remove", row: r }) }]
          : canResend(r)
            ? [{ label: "Resend Invite", onSelect: () => void resend(r) }]
            : [];

    return [
      { header: "Name", cls: "flex-1 min-w-[200px] py-5", cell: (r) => <PersonCell name={r.name} email={r.email} /> },
      kind === "staff"
        ? { header: "Role", cls: "w-40 shrink-0 py-5", cell: (r) => <span className="leading-5">{r.role}</span> }
        : { header: "Player", cls: "w-44 shrink-0 py-5", cell: (r) => <span className="leading-5">{r.player}</span> },
      {
        header: "Status",
        cls: "w-28 shrink-0 py-5",
        cell: (r) => (
          <StatusPill
            label={r.status}
            color={r.status === "Requested" ? "bg-teal" : invitationColor(r.status)}
            className="whitespace-nowrap"
          />
        ),
      },
      {
        header: "",
        cls: "w-14 shrink-0 py-5 flex justify-end",
        cell: (r) => {
          const items = actionsFor(r);
          return items.length ? <RowActionsMenu items={items} ariaLabel={`Actions for ${r.name}`} /> : null;
        },
      },
    ];
  }, [kind, fanHubTeamId, reload]);

  const runConfirm = async ({ kind: action, row }: Confirm) => {
    const result = await apiCall({
      endpoint: action === "remove" ? routes.api.teamRole(row.member.id) : routes.api.rejectTeamRole(row.member.id),
      method: action === "remove" ? "DELETE" : "POST",
      showSuccessToast: true,
      successMessage: action === "remove" ? `${row.name} removed from the team` : "Request rejected",
    });
    if (result.success) reload();
    return result.success;
  };

  return (
    <>
      <PeopleList
        rows={rows}
        loading={loading}
        columns={columns}
        getKey={(r) => r.member.id}
        searchFields={(r) => [r.name, r.email, r.role, r.player]}
        noun={kind === "staff" ? "staff" : "parents"}
        action={
          <Button
            variant="cta"
            label={kind === "staff" ? "Invite Staff" : "Invite Parent"}
            icon={<Plus className="size-5" strokeWidth={2} />}
            className="shrink-0"
            onClick={() => setInviteOpen(true)}
          />
        }
      />

      {/* Mounted per open so each invite starts empty. */}
      {inviteOpen && (
        <InviteRoleModal
          isOpen
          onClose={() => setInviteOpen(false)}
          fanHubTeamId={fanHubTeamId}
          kind={kind}
          players={players}
          onSent={reload}
        />
      )}

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "reject" ? "Reject Request" : kind === "staff" ? "Remove Staff" : "Remove Parent"}
        message={
          confirm?.kind === "reject"
            ? `${confirm.row.name} won't be added to this team.`
            : `${confirm?.row.name} will lose this team in the Fan Hub app and in chat right away.`
        }
        confirmLabel={confirm?.kind === "reject" ? "Reject" : "Remove"}
        busyLabel={confirm?.kind === "reject" ? "Rejecting…" : "Removing…"}
        destructive
        onConfirm={() => (confirm ? runConfirm(confirm) : Promise.resolve(false))}
      />
    </>
  );
}
