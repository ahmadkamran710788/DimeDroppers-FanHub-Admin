// Event-team roles of a tournament organisation (GET/POST /fanhub/org/team-roles).

export type TeamRole = "COACH" | "SCOREKEEPER" | "VIDEOGRAPHER" | "PLAYER" | "PARENT";
export type TeamRoleStatus = "INVITED" | "REQUESTED" | "ACTIVE" | "REJECTED" | "REVOKED" | "DECLINED";
// What the invite body takes; the response carries the words ("Head Coach").
export type StaffTitle = "HEAD_COACH" | "ASSISTANT_COACH";

export interface TeamRoleMember {
  id: string;
  fanHubTeamId: string | null;
  role: TeamRole;
  fanId: string | null;
  email: string;
  status: TeamRoleStatus;
  fanHubPlayerId: string | null;
  // "Head Coach" / "Assistant Coach"; null for other roles and older rows.
  staffTitle: string | null;
  invitedAt: string | null;
  requestedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  fan: { id: string; name: string | null; email: string } | null;
}

export interface TeamRoleListResponse {
  data: TeamRoleMember[] | { items: TeamRoleMember[] }[];
}
