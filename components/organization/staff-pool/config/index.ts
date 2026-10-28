import { routes } from "@/utils/routes";

// Everything that differs between staff pools (scorekeepers, videographers): wording
// and endpoints. The page and dialogs are shared.
export interface StaffPoolConfig {
  // Singular role name for copy, e.g. "Scorekeeper".
  role: string;
  // Line under the page title.
  description: string;
  endpoints: {
    list: string;
    invite: string;
    accept: (memberId: string) => string;
    reject: (memberId: string) => string;
    // Optional ACTIVE → REVOKED action; hidden when the pool has no revoke endpoint.
    revoke?: (memberId: string) => string;
  };
}

export const SCOREKEEPER_POOL: StaffPoolConfig = {
  role: "Scorekeeper",
  description: "Manage the fans eligible to keep score for your games.",
  endpoints: {
    list: routes.api.listScorekeeperPool,
    invite: routes.api.inviteScorekeeper,
    accept: routes.api.acceptScorekeeper,
    reject: routes.api.rejectScorekeeper,
  },
};

export const VIDEOGRAPHER_POOL: StaffPoolConfig = {
  role: "Videographer",
  description: "Manage the fans eligible to film your games.",
  endpoints: {
    list: routes.api.listVideographerPool,
    invite: routes.api.inviteVideographer,
    accept: routes.api.acceptVideographer,
    reject: routes.api.rejectVideographer,
    revoke: routes.api.revokeVideographer,
  },
};
