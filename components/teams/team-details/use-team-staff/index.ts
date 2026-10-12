"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffMember } from "@/components/teams/data";
import { INVITATION_LABEL, type InvitationStatus } from "@/components/teams/team-details/invitation-status";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

export type StaffRole = "HEAD_COACH" | "ASSISTANT_COACH" | "OTHER";

// One entry of GET /fanhub/org/roster/staff.
interface StaffEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  role: StaffRole;
  title: string | null;
  email: string | null;
  phone: string | null;
  onStaff: boolean;
  invitationStatus: InvitationStatus;
  invitation: { isExpired: boolean } | null;
}

// A staff row plus what the row actions need from the API entry.
export interface TeamStaffMember extends StaffMember {
  roleValue: StaffRole;
  invitationStatus: InvitationStatus;
  // A pending invitation past its 7 days; it can be sent again.
  invitationExpired: boolean;
}

const ROLE_TITLE: Record<StaffRole, string> = {
  HEAD_COACH: "Head Coach",
  ASSISTANT_COACH: "Assistant Coach",
  OTHER: "Staff",
};

const toMember = (s: StaffEntry): TeamStaffMember => {
  const invitationExpired = s.invitationStatus === "INVITED" && !!s.invitation?.isExpired;
  return {
    id: s.id,
    name: [s.firstName, s.lastName].filter(Boolean).join(" "),
    role: s.title ?? ROLE_TITLE[s.role],
    email: s.email ?? "",
    phone: s.phone ?? "",
    status: invitationExpired ? "Expired" : (INVITATION_LABEL[s.invitationStatus] ?? s.invitationStatus),
    roleValue: s.role,
    invitationStatus: s.invitationStatus,
    invitationExpired,
  };
};

// A team's staff list from the roster API; `reload` refetches it after a change.
export function useTeamStaff(schoolTeamId: string) {
  const [staff, setStaff] = useState<TeamStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: StaffEntry[] }>({
      endpoint: routes.api.rosterStaff,
      method: "GET",
      data: { schoolTeamId },
    }).then((result) => {
      if (cancelled) return;
      const entries = result.success ? (result.data?.data ?? []) : [];
      setStaff(entries.filter((s) => s.onStaff).map(toMember));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [schoolTeamId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { staff, loading, reload };
}
