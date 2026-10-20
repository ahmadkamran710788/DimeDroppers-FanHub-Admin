"use client";

import StaffPoolPage from "@/components/organization/staff-pool";
import { SCOREKEEPER_POOL } from "@/components/organization/staff-pool/config";

export default function ScorekeepersPage() {
  return <StaffPoolPage config={SCOREKEEPER_POOL} />;
}
