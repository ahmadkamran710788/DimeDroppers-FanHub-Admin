import { routes } from "@/utils/routes";

// Everything that differs between staff pools (scorekeepers, videographers): wording,
// proxy endpoints and the apiCall cache tag. The page and dialogs are shared.
export interface StaffPoolConfig {
  // Singular role name for copy, e.g. "Scorekeeper".
  role: string;
  // Line under the page title.
  description: string;
  // apiCall cache tag invalidated after invite / accept / reject / revoke.
  cacheTag: string;
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
  cacheTag: "scorekeeper-pool",
  endpoints: {
    list: routes.api.proxyListScorekeeperPool,
    invite: routes.api.proxyInviteScorekeeper,
    accept: routes.api.proxyAcceptScorekeeper,
    reject: routes.api.proxyRejectScorekeeper,
  },
};

export const VIDEOGRAPHER_POOL: StaffPoolConfig = {
  role: "Videographer",
  description: "Manage the fans eligible to film your games.",
  cacheTag: "videographer-pool",
  endpoints: {
    list: routes.api.proxyListVideographerPool,
    invite: routes.api.proxyInviteVideographer,
    accept: routes.api.proxyAcceptVideographer,
    reject: routes.api.proxyRejectVideographer,
    revoke: routes.api.proxyRevokeVideographer,
  },
};
