import type { StaffPoolMember, StaffPoolResponse, StaffPoolStatus } from "@/utils/types/staff-pool";

// The videographer pool mirrors the scorekeeper pool field-for-field
// (docs/fanhub-videographer-pool-api.md), so it reuses the shared staff-pool shape.
export type VideographerStatus = StaffPoolStatus;
export type VideographerPoolMember = StaffPoolMember;
export type VideographerPoolResponse = StaffPoolResponse;
