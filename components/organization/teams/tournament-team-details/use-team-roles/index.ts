"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TeamRoleListResponse, TeamRoleMember } from "@/utils/types/team-role";

// The list may come as rows in `data` or as `data[0].items`.
const rowsOf = (body: TeamRoleListResponse | null | undefined): TeamRoleMember[] => {
  const data = body?.data ?? [];
  const first = data[0] as { items?: TeamRoleMember[] } | undefined;
  return first && Array.isArray(first.items) ? first.items : (data as TeamRoleMember[]);
};

// Everyone holding, invited to or asking for a role on an event team; `reload` refetches after a change.
export function useTeamRoles(fanHubTeamId: string) {
  const [members, setMembers] = useState<TeamRoleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiCall<TeamRoleListResponse>({ endpoint: routes.api.teamRoles, method: "GET", data: { fanHubTeamId } }).then((result) => {
      if (cancelled) return;
      setMembers(result.success ? rowsOf(result.data) : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fanHubTeamId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { members, loading, reload };
}
