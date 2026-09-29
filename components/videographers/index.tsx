"use client";

import StaffPoolPage from "@/components/staff-pool";
import { VIDEOGRAPHER_POOL } from "@/components/staff-pool/config";

export default function VideographersPage() {
  return <StaffPoolPage config={VIDEOGRAPHER_POOL} />;
}
