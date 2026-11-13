"use client";

import { useState } from "react";
import ConfirmModal from "@/components/common/confirm-modal";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import { playerName } from "@/components/organization/teams/tournament-team-details/invite-role-modal";
import InvitePlayerModal from "@/components/organization/teams/tournament-team-details/invite-player-modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposurePlayer } from "@/utils/types/exposure-event";
import type { TeamRoleMember } from "@/utils/types/team-role";

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");

type Status = "Active" | "Invited" | "Expired" | "Declined" | "Withdrawn" | "Not Invited";

// Where a player's invitation stands, from the team's PLAYER role rows (an invite creates one with
// the player's fanHubPlayerId); the players list itself doesn't carry it.
function statusOf(player: ExposurePlayer, members: TeamRoleMember[]): { status: Status; email: string | null } {
  const rows = members.filter((m) => m.role === "PLAYER" && m.fanHubPlayerId === player.id);
  const active = rows.find((m) => m.status === "ACTIVE");
  if (active) return { status: "Active", email: active.fan?.email ?? active.email };
  const latest = rows.sort((a, b) => (b.invitedAt ?? b.createdAt).localeCompare(a.invitedAt ?? a.createdAt))[0];
  if (!latest) return { status: "Not Invited", email: null };
  if (latest.status === "INVITED") {
    const expired = !!latest.expiresAt && new Date(latest.expiresAt).getTime() < Date.now();
    return { status: expired ? "Expired" : "Invited", email: latest.email };
  }
  return { status: latest.status === "DECLINED" ? "Declined" : latest.status === "REVOKED" ? "Withdrawn" : "Not Invited", email: latest.email };
}

interface PlayersTabProps {
  fanHubTeamId: string;
  players: ExposurePlayer[];
  // The team's role rows (useTeamRoles), for each player's invitation status.
  members: TeamRoleMember[];
  loading: boolean;
  // Loads the players and roles again after an invite or a withdrawal.
  onChanged: () => void;
}

// A tournament team's Players tab: the roster synced from Exposure (no add / edit / remove), with
// Invite and Withdraw per player (POST / DELETE /roster/fanhub-teams/{id}/players/{playerId}/invite).
export default function PlayersTab({ fanHubTeamId, players, members, loading, onChanged }: PlayersTabProps) {
  const [inviting, setInviting] = useState<ExposurePlayer | null>(null);
  const [withdrawing, setWithdrawing] = useState<ExposurePlayer | null>(null);

  const columns: Column<ExposurePlayer>[] = [
    {
      header: "Player",
      cls: "flex-1 min-w-[200px] py-5",
      cell: (p) => <PersonCell name={playerName(p)} email={statusOf(p, members).email ?? p.email ?? ""} />,
    },
    { header: "No.", cls: "w-16 shrink-0 py-5", cell: (p) => dash(p.number) },
    { header: "Position", cls: "w-24 shrink-0 py-5", cell: (p) => dash(p.position) },
    { header: "Grade", cls: "w-20 shrink-0 py-5", cell: (p) => dash(p.grade) },
    { header: "School", cls: "w-44 shrink-0 py-5", cell: (p) => <span className="leading-5">{dash(p.playerSchool)}</span> },
    {
      header: "Status",
      cls: "w-32 shrink-0 py-5",
      cell: (p) => {
        const { status } = statusOf(p, members);
        return <StatusPill label={status} color={invitationColor(status)} />;
      },
    },
    {
      header: "",
      cls: "w-14 shrink-0 py-5 flex justify-end",
      cell: (p) => {
        const { status } = statusOf(p, members);
        if (status === "Active") return null;
        return (
          <RowActionsMenu
            ariaLabel={`Actions for ${playerName(p)}`}
            items={
              status === "Invited"
                ? [{ label: "Withdraw Invite", onSelect: () => setWithdrawing(p), variant: "destructive" }]
                : [{ label: status === "Not Invited" ? "Invite" : "Invite Again", onSelect: () => setInviting(p) }]
            }
          />
        );
      },
    },
  ];

  const withdraw = async (p: ExposurePlayer) => {
    const result = await apiCall({
      endpoint: routes.api.rosterFanHubPlayerInvite(fanHubTeamId, p.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: "Invitation withdrawn",
    });
    if (result.success) onChanged();
    return result.success;
  };

  return (
    <>
      <PeopleList
        rows={players}
        loading={loading}
        columns={columns}
        getKey={(p) => p.id}
        searchFields={(p) => [playerName(p), p.email ?? "", p.number ?? "", p.position ?? "", p.playerSchool ?? ""]}
        noun="players"
      />

      {/* Mounted per open so each invite starts from its player. */}
      {inviting && (
        <InvitePlayerModal onClose={() => setInviting(null)} fanHubTeamId={fanHubTeamId} player={inviting} onSent={onChanged} />
      )}

      <ConfirmModal
        isOpen={!!withdrawing}
        onClose={() => setWithdrawing(null)}
        title="Withdraw Invite"
        message={`${withdrawing ? playerName(withdrawing) : ""}'s invitation will be cancelled. You can invite them again later.`}
        confirmLabel="Withdraw"
        busyLabel="Withdrawing…"
        destructive
        onConfirm={() => (withdrawing ? withdraw(withdrawing) : Promise.resolve(false))}
      />
    </>
  );
}
