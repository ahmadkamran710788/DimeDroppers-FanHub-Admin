// Shared shape for the org's staff pools (scorekeepers, videographers). The backend
// returns identical rows and statuses for both — only the endpoint names differ.

export type StaffPoolStatus = "INVITED" | "REQUESTED" | "ACTIVE" | "REJECTED" | "REVOKED";

/**
 * A pool row reaches us one of two ways, and the shape differs:
 * - org-invited  → top-level `email`, `fanId: null`, no `fan` object
 * - fan-requested → nested `fan`, no top-level `email`
 */
export interface StaffPoolMember {
  id: string;
  schoolId?: string;
  fanId?: string | null;
  email?: string | null;
  status: StaffPoolStatus;
  fan?: { name?: string | null; email?: string | null } | null;
  inviteToken?: string | null;
  invitedAt?: string | null;
  expiresAt?: string | null;
  respondedAt?: string | null;
}

export interface StaffPoolResponse {
  statusCode: number;
  success?: boolean;
  message: string;
  errorCode?: string | null;
  data: StaffPoolMember[];
}
