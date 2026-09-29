"use client";

import StaffPoolPage from "@/components/staff-pool";
import { SCOREKEEPER_POOL } from "@/components/staff-pool/config";

export default function ScorekeepersPage() {
  return <StaffPoolPage config={SCOREKEEPER_POOL} />;
}
