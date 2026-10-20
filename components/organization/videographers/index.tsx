"use client";

import StaffPoolPage from "@/components/organization/staff-pool";
import { VIDEOGRAPHER_POOL } from "@/components/organization/staff-pool/config";

export default function VideographersPage() {
  return <StaffPoolPage config={VIDEOGRAPHER_POOL} />;
}
