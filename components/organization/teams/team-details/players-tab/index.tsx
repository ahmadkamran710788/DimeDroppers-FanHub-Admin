"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import InvitePlayerModal from "@/components/organization/teams/invite-player-modal";
import AddPlayerModal from "@/components/organization/teams/team-details/add-player-modal";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import type { RosterPlayer } from "@/components/organization/teams/team-details/use-team-players";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

type Confirm = { kind: "withdraw" | "remove"; player: RosterPlayer };

const playerSearch = (p: RosterPlayer) => [p.name, p.email, p.position, p.number];

// Invite until the player is on Fan Hub or has an invitation pending; a pending one can be withdrawn.
// (The roster API doesn't say when an invitation expired, so a pending one is only withdrawn, not resent.)
const canInvite = (p: RosterPlayer) => p.invitationStatus !== "ACTIVE" && p.invitationStatus !== "INVITED";
const isPending = (p: RosterPlayer) => p.invitationStatus === "INVITED";

interface PlayersTabProps {
  // The school team (its schoolTeamId).
  teamId: string;
  players: RosterPlayer[];
  loading: boolean;
  // Refetches the roster after a change.
  reload: () => void;
}

// The Players tab of a school team: Add Player, and Invite / Withdraw Invite / Edit / Remove on each row.
export default function PlayersTab({ teamId, players, loading, reload }: PlayersTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RosterPlayer | null>(null);
  const [inviting, setInviting] = useState<RosterPlayer | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const runConfirm = async ({ kind, player }: Confirm) => {
    const result = await apiCall({
      endpoint:
        kind === "withdraw"
          ? routes.api.rosterSchoolPlayerInvite(teamId, player.id)
          : routes.api.rosterSchoolPlayer(teamId, player.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: kind === "withdraw" ? "Invitation withdrawn" : `${player.name} removed from the roster`,
    });
    if (result.success) reload();
    return result.success;
  };

  const columns = useMemo<Column<RosterPlayer>[]>(() => {
    const actionsFor = (p: RosterPlayer): RowAction[] => [
      ...(canInvite(p)
        ? [{ label: p.invitationStatus === "NONE" ? "Invite" : "Invite Again", onSelect: () => setInviting(p) }]
        : []),
      ...(isPending(p) ? [{ label: "Withdraw Invite", onSelect: () => setConfirm({ kind: "withdraw", player: p }) }] : []),
      {
        label: "Edit",
        onSelect: () => {
          setEditing(p);
          setFormOpen(true);
        },
      },
      { label: "Remove", variant: "destructive", onSelect: () => setConfirm({ kind: "remove", player: p }) },
    ];
    return [
      { header: "Player", cls: "flex-1 min-w-[200px] py-5", cell: (p) => <PersonCell name={p.name} email={p.email} /> },
      { header: "Jersey #", cls: "w-20 shrink-0 py-5 whitespace-nowrap", cell: (p) => p.number || "—" },
      { header: "Position", cls: "w-28 shrink-0 py-5", cell: (p) => <span className="leading-5">{p.position || "—"}</span> },
      { header: "Parents", cls: "w-20 shrink-0 py-5", cell: (p) => p.parentCount },
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

  const confirmPlayer = confirm?.player;

  return (
    <>
      <PeopleList
        rows={players}
        loading={loading}
        columns={columns}
        getKey={(p) => p.id}
        searchFields={playerSearch}
        noun="players"
        action={
          <Button
            variant="cta"
            label="Add Player"
            icon={<Plus className="size-5" strokeWidth={2} />}
            className="shrink-0"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />

      {/* Mounted per open so an edit starts from the player it was opened for. */}
      {formOpen && (
        <AddPlayerModal isOpen onClose={() => setFormOpen(false)} teamId={teamId} player={editing} onSaved={reload} />
      )}
      {inviting && (
        <InvitePlayerModal
          onClose={() => setInviting(null)}
          name={inviting.name}
          endpoint={routes.api.rosterSchoolPlayerInvite(teamId, inviting.id)}
          defaultEmail={inviting.email}
          onSent={reload}
        />
      )}

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "withdraw" ? "Withdraw Invitation" : "Remove Player"}
        message={
          confirm?.kind === "withdraw"
            ? `${confirmPlayer?.name} will no longer be able to accept the invitation. You can invite them again later.`
            : confirmPlayer?.invitationStatus === "ACTIVE"
              ? `${confirmPlayer.name} will be removed from the roster and lose player access to this team in the Fan Hub app.`
              : `${confirmPlayer?.name} will be removed from the roster${
                  confirmPlayer && isPending(confirmPlayer) ? " and their pending invitation withdrawn" : ""
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
