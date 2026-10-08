"use client";

import { useEffect, useState } from "react";
import { INVITATION_LABEL, type InvitationStatus } from "@/components/teams/team-details/invitation-status";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

// One parent of a player in GET /fanhub/org/roster/players.
interface ParentEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  invitationStatus: InvitationStatus;
}

// One entry of GET /fanhub/org/roster/players.
interface PlayerEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  number: string | null;
  position: string | null;
  photoUrl: string | null;
  email: string | null;
  onRoster: boolean;
  invitationStatus: InvitationStatus;
  parents: ParentEntry[];
}

export interface RosterPlayer {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  number: string;
  position: string;
  parentCount: number;
  status: string;
}

export interface RosterParent {
  id: string;
  name: string;
  email: string;
  phone: string;
  // The player this parent belongs to, e.g. "#14 Ravi Trainer".
  player: string;
  status: string;
}

const fullName = (first: string, last: string | null) => [first, last].filter(Boolean).join(" ");

// A team's read-only roster: players and their parents. The coach adds and invites them from the app.
export function useTeamPlayers(schoolTeamId: string) {
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [parents, setParents] = useState<RosterParent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: PlayerEntry[] }>({
      endpoint: routes.api.proxyRosterPlayers,
      method: "GET",
      data: { schoolTeamId },
    }).then((result) => {
      if (cancelled) return;
      const entries = (result.success ? (result.data?.data ?? []) : []).filter((p) => p.onRoster);
      setPlayers(
        entries.map((p) => ({
          id: p.id,
          name: fullName(p.firstName, p.lastName),
          email: p.email ?? "",
          photoUrl: p.photoUrl,
          number: p.number ?? "",
          position: p.position ?? "",
          parentCount: p.parents.length,
          status: INVITATION_LABEL[p.invitationStatus] ?? p.invitationStatus,
        })),
      );
      setParents(
        entries.flatMap((p) =>
          p.parents.map((parent) => ({
            id: parent.id,
            name: fullName(parent.firstName, parent.lastName),
            email: parent.email ?? "",
            phone: parent.phone ?? "",
            player: [p.number && `#${p.number}`, fullName(p.firstName, p.lastName)].filter(Boolean).join(" "),
            status: INVITATION_LABEL[parent.invitationStatus] ?? parent.invitationStatus,
          })),
        ),
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [schoolTeamId]);

  return { players, parents, loading };
}
