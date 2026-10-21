"use client";

import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/components/organization/teams/data";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

export interface DepartmentTeam {
  id: string;
  name: string;
  level: string | null;
  // Boys / Girls / Coed; null when the team's name says nothing.
  gender?: string | null;
  logoUrl: string | null;
}

// A sport ("department") and its teams.
export interface Department {
  id: string;
  name: string;
  teams: DepartmentTeam[];
}

// GET /fanhub/org/departments: `data` holds one entry with the org's sport departments and their teams.
interface DepartmentsResponse {
  data: { departments: Department[] }[];
}

// Ring around the crest, by sport, so teams of one sport read as a group.
const RING: Record<string, string> = { Basketball: "#9CA3AF", Football: "#3B84C9", Soccer: "#C0392B" };

export const sportRing = (sport: string) => RING[sport] ?? "#638BFE";

const toTeam = (department: Department, t: DepartmentTeam): Team => ({
  id: t.id,
  name: t.name,
  // The departments endpoint doesn't name the school; the sport already shows in its own column.
  schoolName: "",
  sport: department.name,
  level: t.level ?? "—",
  // The departments endpoint has no coach or roster counts yet.
  headCoach: "—",
  status: "Active",
  ring: sportRing(department.name),
});

// The organisation's sports and real teams. Each team id is the schoolTeamId the roster and staff
// calls take. `reload` refetches after a sport or team is added or edited (those calls clear the cache).
export function useOrgTeams() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiCall<DepartmentsResponse>({ endpoint: routes.api.orgDepartments, method: "GET" }).then((result) => {
      if (cancelled) return;
      if (result.success) setDepartments(result.data?.data?.[0]?.departments ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const teams = departments.flatMap((d) => d.teams.map((t) => toTeam(d, t)));

  return { departments, teams, loading, reload };
}
