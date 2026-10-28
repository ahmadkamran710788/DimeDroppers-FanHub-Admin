"use client";

import { startTransition, useState, ViewTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import BadgeStatCard, {
  STAT_TINTS,
  type BadgeStat,
} from "@/components/common/badge-stat-card";
import Button from "@/components/common/button";
import EditTeamModal from "@/components/organization/teams/edit-team-modal";
import SportModal from "@/components/organization/teams/sport-modal";
import SportsList from "@/components/organization/teams/sports-list";
import EventSelect from "@/components/organization/event-select";
import { useSelectedEvent } from "@/context/selected-event";
import TournamentTeams, { type TournamentFocus } from "@/components/organization/teams/tournament-teams";
import type { TournamentTotals } from "@/utils/types/exposure-event";
import {
  useOrgTeams,
  type Department,
  type DepartmentTeam,
} from "@/components/organization/teams/use-org-teams";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";

// The sport modal: a new sport, or the sport being renamed.
type SportEditing = { sport: Department | null } | null;

// Teams. A school sees its activities (sports) with their teams: add / rename an activity and edit
// a team here; a team is added on its own page. A tournament sees Events → Divisions → Teams from
// its synced events and adds nothing.
export default function TeamsPage() {
  const router = useRouter();
  const { savedSchool } = useSetup();
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  // Tournament stat cards: organisation-wide totals from the division-teams API (TournamentTeams),
  // narrowed to the open event and then to its open division.
  const [totals, setTotals] = useState<TournamentTotals | null>(null);
  const [focus, setFocus] = useState<TournamentFocus | null>(null);
  // The tournament event picked in the header (the newest at first).
  // Shared with every page's event picker.
  const { event: pickedEvent, setEvent: setPickedEvent } = useSelectedEvent();
  // In a transition, so the cards that leave or move animate (the ViewTransitions below).
  // Stable, since TournamentTeams refetches when it changes.
  const changeFocus = useCallback((next: TournamentFocus | null) => startTransition(() => setFocus(next)), []);
  const { departments, teams, loading, reload } = useOrgTeams();
  const [sportEditing, setSportEditing] = useState<SportEditing>(null);
  const [teamEditing, setTeamEditing] = useState<{
    team: DepartmentTeam;
    sport: Department;
  } | null>(null);
  const count = loading ? "—" : teams.length;

  // Roster and staff totals need counts the teams endpoint doesn't return yet.
  const fmt = (n: number) => n.toLocaleString("en-US");
  const total = (key: keyof TournamentTotals) => (totals ? fmt(totals[key]) : "—");
  const divisionsCard = (value: string, caption: string): BadgeStat => ({
    label: "Divisions",
    value,
    caption,
    tint: STAT_TINTS.green,
  });
  const teamsCard = (value: string, caption: string): BadgeStat => ({
    label: "Teams",
    value,
    caption,
    tint: STAT_TINTS.purple,
  });
  // An open event leaves its Divisions and Teams; an open division leaves just its Teams.
  const tournamentStats: BadgeStat[] = focus?.division
    ? [teamsCard(fmt(focus.division.teamCount), "In this division")]
    : focus
      ? [
          divisionsCard(fmt(focus.event.divisionCount), "In this event"),
          teamsCard(fmt(focus.event.teamCount), "In this event"),
        ]
      : [
          {
            label: "Events",
            value: total("events"),
            caption: "Synced events",
            tint: STAT_TINTS.blue,
          },
          divisionsCard(total("divisions"), "Across all events"),
          teamsCard(total("teams"), "Across all events"),
          {
            label: "Games",
            value: total("games"),
            caption: "Across all events",
            tint: STAT_TINTS.brown,
          },
        ];
  const stats: BadgeStat[] = isTournament
    ? tournamentStats
    : [
        {
          label: "Total Teams",
          value: count,
          caption: "All Activities",
          tint: STAT_TINTS.blue,
        },
        {
          label: "Activities",
          value: loading ? "—" : departments.length,
          caption: "Sports and programs",
          tint: STAT_TINTS.green,
        },
        {
          label: "Total Athletes",
          value: "—",
          caption: "Across all teams",
          tint: STAT_TINTS.purple,
        },
        {
          label: "Coaches & Staff",
          value: "—",
          caption: "Across all teams",
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
          <p className="text-base text-white/80">
            {isTournament
              ? "Browse your events' divisions and the teams playing in them."
              : "Manage your activities, teams, rosters, staff, and team information."}
          </p>
        </div>
        {/* A tournament's teams come from its events: it picks one here and adds nothing. */}
        {isTournament && (
          <EventSelect
            value={pickedEvent?.id ?? ""}
            onChange={(id, name) => setPickedEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={pickedEvent?.name}
          />
        )}
        {!isTournament && (
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              label="Add Activity"
              icon={<Plus className="size-5" />}
              onClick={() => setSportEditing({ sport: null })}
            />
            <Button
              variant="cta"
              label="Add Team"
              className="px-12"
              onClick={() => router.push(routes.ui.addTeam)}
            />
          </div>
        )}
      </div>

      {/* Stat cards. When the tournament focus changes, cards that leave fade out and the rest slide
          into place (the stat-card view-transition classes in globals.css). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <ViewTransition key={stat.label} enter="stat-card-enter" exit="stat-card-exit" update="stat-card-move">
            <BadgeStatCard {...stat} />
          </ViewTransition>
        ))}
      </div>

      {/* Sports and their teams */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        {isTournament ? (
          <TournamentTeams key={pickedEvent?.id ?? "none"} eventId={pickedEvent?.id ?? ""} onTotals={setTotals} focus={focus} onFocus={changeFocus} />
        ) : (
          <SportsList
            departments={departments}
            loading={loading}
            crest={savedSchool?.logoUrl || "/images/preview-crest.png"}
            onRenameSport={(sport) => setSportEditing({ sport })}
            onEditTeam={(team, sport) => setTeamEditing({ team, sport })}
          />
        )}
      </div>

      {sportEditing && (
        <SportModal
          sport={sportEditing.sport}
          onClose={() => setSportEditing(null)}
          onSaved={reload}
        />
      )}
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
