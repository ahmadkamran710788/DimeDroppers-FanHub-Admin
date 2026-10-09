"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/components/teams/data";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

interface DepartmentTeam {
  id: string;
  name: string;
  level: string | null;
  logoUrl: string | null;
}

interface Department {
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
  ring: RING[department.name] ?? "#638BFE",
});

// The organisation's real teams. Each team id is the schoolTeamId the roster and staff calls take.
export function useOrgTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<DepartmentsResponse>({ endpoint: routes.api.orgDepartments, method: "GET" }).then((result) => {
      if (cancelled) return;
      const departments = result.success ? (result.data?.data?.[0]?.departments ?? []) : [];
      setTeams(departments.flatMap((d) => d.teams.map((t) => toTeam(d, t))));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { teams, loading };
}
