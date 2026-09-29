import type { StaffPoolMember, StaffPoolResponse, StaffPoolStatus } from "@/utils/types/staff-pool";

// The scorekeeper pool uses the shared staff-pool shape (see utils/types/staff-pool.ts).
// Read display values through `getScorekeeperName`/`getScorekeeperEmail`.
export type ScorekeeperStatus = StaffPoolStatus;
export type ScorekeeperPoolMember = StaffPoolMember;
export type ScorekeeperPoolResponse = StaffPoolResponse;

// ─── Bulk assign (PUT /fanhub/org/scorekeeper/bulk-assign) ──────────────────────

export interface ScorekeeperBulkAssignResult {
  fan: { id: string; name: string | null };
  assignedCount: number;
}

export interface ScorekeeperBulkAssignResponse {
  statusCode: number;
  success?: boolean;
  message: string;
  errorCode?: string | null;
  data: ScorekeeperBulkAssignResult[];
}
