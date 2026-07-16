export type ScorekeeperStatus =
  | "INVITED"
  | "REQUESTED"
  | "ACTIVE"
  | "REJECTED"
  | "REVOKED";

/**
 * A pool row reaches us one of two ways, and the shape differs:
 * - org-invited  → top-level `email`, `fanId: null`, no `fan` object
 * - fan-requested → nested `fan`, no top-level `email`
 * Read display values through `getScorekeeperName`/`getScorekeeperEmail`.
 */
export interface ScorekeeperPoolMember {
  id: string;
  schoolId?: string;
  fanId?: string | null;
  email?: string | null;
  status: ScorekeeperStatus;
  fan?: { name?: string | null; email?: string | null } | null;
  inviteToken?: string | null;
  invitedAt?: string | null;
  expiresAt?: string | null;
  respondedAt?: string | null;
}

export interface ScorekeeperPoolResponse {
  statusCode: number;
  success?: boolean;
  message: string;
  errorCode?: string | null;
  data: ScorekeeperPoolMember[];
}
