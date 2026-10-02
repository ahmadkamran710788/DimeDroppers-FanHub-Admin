"use client";

import { useRouter } from "next/navigation";
import BadgeStatCard, { STAT_TINTS, type BadgeStat } from "@/components/common/badge-stat-card";
import Button from "@/components/common/button";
import TeamsTable from "@/components/teams/teams-table";
import { TEAMS, TEAM_STATS } from "@/components/teams/data";
import { routes } from "@/utils/routes";

export default function TeamsPage() {
  const router = useRouter();

  const stats: BadgeStat[] = [
    { label: "Total Teams", value: TEAMS.length, caption: "All Sports", tint: STAT_TINTS.blue },
    {
      label: "Active Teams",
      value: TEAMS.filter((t) => t.status === "Active").length,
      caption: "This Season",
      tint: STAT_TINTS.green,
    },
    {
      label: "Total Athletes",
      value: TEAMS.reduce((sum, t) => sum + t.athletes, 0),
      caption: TEAM_STATS.athletesPct,
      tint: STAT_TINTS.purple,
    },
    {
      label: "Coaches & Staff",
      value: TEAM_STATS.coachesAndStaff,
      caption: TEAM_STATS.coachesAndStaffPct,
      tint: STAT_TINTS.brown,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Title + Add */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Teams
          </h2>
          <p className="text-base text-white/80">Manage your teams, rosters, staff, and team information.</p>
        </div>
        <Button variant="cta" label="Add Team" className="px-12" onClick={() => router.push(routes.ui.addTeam)} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <BadgeStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Teams list */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <TeamsTable collapsible />
      </div>
    </div>
  );
}
