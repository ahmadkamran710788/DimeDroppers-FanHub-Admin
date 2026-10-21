"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import BadgeStatCard, { STAT_TINTS, type BadgeStat } from "@/components/common/badge-stat-card";
import Button from "@/components/common/button";
import EditTeamModal from "@/components/organization/teams/edit-team-modal";
import SportModal from "@/components/organization/teams/sport-modal";
import SportsList from "@/components/organization/teams/sports-list";
import { useOrgTeams, type Department, type DepartmentTeam } from "@/components/organization/teams/use-org-teams";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";

// The sport modal: a new sport, or the sport being renamed.
type SportEditing = { sport: Department | null } | null;

// Teams: the org's sports with their teams. Add / rename a sport and edit a team here; a team is
// added on its own page.
export default function TeamsPage() {
  const router = useRouter();
  const { savedSchool } = useSetup();
  // A tournament doesn't add teams of its own.
  const { org } = useAuth();
  const canAddTeam = orgKindOf(org) !== "tournament";
  const { departments, teams, loading, reload } = useOrgTeams();
  const [sportEditing, setSportEditing] = useState<SportEditing>(null);
  const [teamEditing, setTeamEditing] = useState<{ team: DepartmentTeam; sport: Department } | null>(null);
  const count = loading ? "—" : teams.length;

  // Roster and staff totals need counts the teams endpoint doesn't return yet.
  const stats: BadgeStat[] = [
    { label: "Total Teams", value: count, caption: "All Activities", tint: STAT_TINTS.blue },
    { label: "Activities", value: loading ? "—" : departments.length, caption: "Sports and programs", tint: STAT_TINTS.green },
    { label: "Total Athletes", value: "—", caption: "Across all teams", tint: STAT_TINTS.purple },
    { label: "Coaches & Staff", value: "—", caption: "Across all teams", tint: STAT_TINTS.brown },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Title + Add */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Teams
          </h2>
          <p className="text-base text-white/80">Manage your activities, teams, rosters, staff, and team information.</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button label="Add Activity" icon={<Plus className="size-5" />} onClick={() => setSportEditing({ sport: null })} />
          {canAddTeam && <Button variant="cta" label="Add Team" className="px-12" onClick={() => router.push(routes.ui.addTeam)} />}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <BadgeStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Sports and their teams */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <SportsList
          departments={departments}
          loading={loading}
          crest={savedSchool?.logoUrl || "/images/preview-crest.png"}
          onRenameSport={(sport) => setSportEditing({ sport })}
          onEditTeam={(team, sport) => setTeamEditing({ team, sport })}
        />
      </div>

      {sportEditing && <SportModal sport={sportEditing.sport} onClose={() => setSportEditing(null)} onSaved={reload} />}
      {teamEditing && (
        <EditTeamModal
          team={teamEditing.team}
          sport={teamEditing.sport.name}
          departments={departments}
          onClose={() => setTeamEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
