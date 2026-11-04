"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposureListResponse, ExposurePlayer } from "@/utils/types/exposure-event";
import type { RecognitionRefType } from "@/utils/types/recognition";
import type { TeamRole, TeamRoleListResponse, TeamRoleMember } from "@/utils/types/team-role";

// Whose people to load: tournament teams (by fanHubTeamId; an empty list loads nobody) or, with no `teams`,
// the school roster. `key`
// identifies the source (a game or team id), so a new one reloads.
export interface PeopleSource {
  key: string;
  teams?: { id: string; name: string }[];
  // The school team (schoolTeamId) whose roster to load, when known; else the whole school.
  schoolTeamId?: string;
}

// Someone on one of the game's teams: a player to shout out, or a staff member / parent giving it.
export interface GamePerson {
  id: string;
  name: string;
  // Jersey number (school players only).
  number?: number;
  // Shown under the giver's name on the card, e.g. "Head Coach", "Parent".
  role: string;
  team: string;
  // Which team the person is on (a tournament team id, or "school"), to match a giver with their players.
  teamKey: string;
  // How the recognitions API refers to them (FANHUB_ORG_RECOGNITIONS_FRONTEND.md).
  refType: RecognitionRefType;
}

// One entry of GET /fanhub/org/roster/players.
interface RosterPlayerEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  number: string | null;
  onRoster: boolean;
  parents: { id: string; firstName: string; lastName: string | null }[];
}

// One entry of GET /fanhub/org/roster/staff.
interface RosterStaffEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  role: "HEAD_COACH" | "ASSISTANT_COACH" | "OTHER";
  title: string | null;
  onStaff: boolean;
}

const fullName = (first: string | null, last: string | null) => [first, last].filter(Boolean).join(" ") || "Unnamed";
const label = (p: GamePerson) => `${p.team}|${p.id}`;

const STAFF_TITLE = { HEAD_COACH: "Head Coach", ASSISTANT_COACH: "Assistant Coach", OTHER: "Staff" } as const;
const ROLE_LABEL: Record<TeamRole, string> = {
  COACH: "Coach",
  SCOREKEEPER: "Scorekeeper",
  VIDEOGRAPHER: "Videographer",
  PLAYER: "Player",
  PARENT: "Parent",
};

// The list may come as rows in `data` or as `data[0].items`.
const roleRows = (body: TeamRoleListResponse | null | undefined): TeamRoleMember[] => {
  const data = body?.data ?? [];
  const first = data[0] as { items?: TeamRoleMember[] } | undefined;
  return first && Array.isArray(first.items) ? first.items : (data as TeamRoleMember[]);
};

interface People {
  players: GamePerson[];
  // Staff and parents, who can give the shout-out.
  givers: GamePerson[];
}

// Tournament teams: their rosters and their active team-role members (staff and parents).
async function loadTournament(teamsOf: { id: string; name: string }[]): Promise<People> {

  const teams = await Promise.all(
    teamsOf.map(async ({ id: teamId, name: team }) => {
      const [players, roles] = await Promise.all([
        apiCall<ExposureListResponse<ExposurePlayer>>({ endpoint: routes.api.exposureTeamPlayers(teamId), method: "GET" }),
        apiCall<TeamRoleListResponse>({ endpoint: routes.api.teamRoles, method: "GET", data: { fanHubTeamId: teamId, status: "ACTIVE" } }),
      ]);
      return {
        players: (players.success ? (players.data?.data ?? []) : []).map(
          (p): GamePerson => ({ id: p.id, name: fullName(p.firstName, p.lastName), role: "Player", team, teamKey: teamId, refType: "TOURNAMENT_PLAYER" })
        ),
        givers: (roles.success ? roleRows(roles.data) : [])
          .filter((m) => m.status === "ACTIVE" && m.role !== "PLAYER")
          .map((m): GamePerson => ({ id: m.id, name: m.fan?.name || m.email, role: m.staffTitle ?? ROLE_LABEL[m.role], team, teamKey: teamId, refType: "TEAM_ROLE" })),
      };
    })
  );
  return { players: teams.flatMap((t) => t.players), givers: teams.flatMap((t) => t.givers) };
}

// A school team (or, with no id, the whole school): its roster players with their parents, and its staff.
async function loadSchool(schoolTeamId?: string): Promise<People> {
  // One school team's roster and staff when its id is known, else the whole school's.
  const data = schoolTeamId ? { schoolTeamId } : undefined;
  const [players, staff] = await Promise.all([
    apiCall<{ data: RosterPlayerEntry[] }>({ endpoint: routes.api.rosterPlayers, method: "GET", data }),
    apiCall<{ data: RosterStaffEntry[] }>({ endpoint: routes.api.rosterStaff, method: "GET", data }),

  ]);
  const roster = (players.success ? (players.data?.data ?? []) : []).filter((p) => p.onRoster);
  return {
    players: roster.map((p) => ({
      id: p.id,
      name: fullName(p.firstName, p.lastName),
      number: p.number && /^\d+$/.test(p.number) ? Number(p.number) : undefined,
      role: "Player",
      team: "Players",
      teamKey: "school",
      refType: "ROSTER_PLAYER" as const,
    })),
    givers: [
      ...(staff.success ? (staff.data?.data ?? []) : [])
        .filter((s) => s.onStaff)
        .map((s) => ({ id: s.id, name: fullName(s.firstName, s.lastName), role: s.title ?? STAFF_TITLE[s.role], team: "Staff", teamKey: "school", refType: "ROSTER_STAFF" as const })),
      ...roster.flatMap((p) =>
        p.parents.map((pa) => ({ id: pa.id, name: fullName(pa.firstName, pa.lastName), role: "Parent", team: "Parents", teamKey: "school", refType: "ROSTER_PARENT" as const }))
      ),
    ],
  };
}

// The people of a game or team, for the Add Recognition dropdowns: players to shout out and staff / parents to
// give it. Each list is de-duplicated (a parent of two players appears once).
export function useGamePeople(source: PeopleSource | null) {
  const [loaded, setLoaded] = useState<({ key: string } & People) | null>(null);
  const key = source?.key ?? "";

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    (source.teams ? loadTournament(source.teams) : loadSchool(source.schoolTeamId)).then((people) => {
      if (cancelled) return;
      const unique = (list: GamePerson[]) => [...new Map(list.map((p) => [label(p), p])).values()];
      setLoaded({ key: source.key, players: unique(people.players), givers: unique(people.givers) });
    });
    return () => {
      cancelled = true;
    };
    // The key covers the teams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = loaded?.key === key ? loaded : null;
  return { players: current?.players ?? [], givers: current?.givers ?? [], loading: !!source && !current };
}
