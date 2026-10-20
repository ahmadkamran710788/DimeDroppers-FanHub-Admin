"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import type { Column } from "@/components/common/generic-table";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import { sportIcon } from "@/components/organization/teams/data";
import { invitationColor } from "@/components/organization/teams/team-details/invitation-status";
import ParentsTab from "@/components/organization/teams/team-details/parents-tab";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import StaffTab from "@/components/organization/teams/team-details/staff-tab";
import { useTeamFollowers, type TeamFollower } from "@/components/organization/teams/team-details/use-team-followers";
import { useTeamPlayers, type RosterPlayer } from "@/components/organization/teams/team-details/use-team-players";
import { useTeamStaff } from "@/components/organization/teams/team-details/use-team-staff";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";

const TABS = ["Players", "Parents", "Staff", "Followers"] as const;
// Add Player is not wired to the API yet.
const comingSoon = () => toast("Coming soon.");

type Tab = (typeof TABS)[number];

const PLAYER_COLUMNS: Column<RosterPlayer>[] = [
  { header: "Player", cls: "flex-1 min-w-[200px] py-5", cell: (p) => <PersonCell name={p.name} email={p.email} /> },
  { header: "Jersey #", cls: "w-20 shrink-0 py-5 whitespace-nowrap", cell: (p) => p.number || "—" },
  { header: "Position", cls: "w-28 shrink-0 py-5", cell: (p) => <span className="leading-5">{p.position || "—"}</span> },
  { header: "Parents", cls: "w-20 shrink-0 py-5", cell: (p) => p.parentCount },
  {
    header: "Status",
    cls: "w-28 shrink-0 py-5",
    cell: (p) => <StatusPill label={p.status} color={invitationColor(p.status)} className="whitespace-nowrap" />,
  },
];
const playerSearch = (p: RosterPlayer) => [p.name, p.email, p.position, p.number];

const FOLLOWER_COLUMNS: Column<TeamFollower>[] = [
  { header: "Name", cls: "flex-1 min-w-[200px] py-5", cell: (f) => <PersonCell name={f.name} email={f.email} /> },
  { header: "Type", cls: "w-28 shrink-0 py-5", cell: (f) => f.type },
  {
    header: "Following Since",
    cls: "w-36 shrink-0 py-5",
    cell: (f) =>
      new Date(f.followedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  },
];
const followerSearch = (f: TeamFollower) => [f.name, f.email, f.type];

// Team details: header plus Players / Parents / Staff / Followers lists. The team and its staff
// come from the API (players, parents and followers read-only).
export default function TeamDetailsPage({ teamId }: { teamId: string }) {
  const { savedSchool } = useSetup();
  const [tab, setTab] = useState<Tab>("Players");
  const { teams, loading: teamsLoading } = useOrgTeams();
  const { staff, loading: staffLoading, reload: reloadStaff } = useTeamStaff(teamId);
  const { players, parents, loading: rosterLoading } = useTeamPlayers(teamId);
  const { followers, loading: followersLoading } = useTeamFollowers(teamId);
  const team = teams.find((t) => t.id === teamId);
  const headCoach = staff.find((s) => s.role === "Head Coach")?.name ?? "—";

  const back = (
    <Link
      href={routes.ui.teams}
      className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
    >
      <ArrowLeft className="size-6" strokeWidth={1.5} />
      Back to Teams
    </Link>
  );

  if (!team) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <p className="py-16 text-center text-sm text-white/60">
          {teamsLoading ? "Loading team…" : "This team could not be found."}
        </p>
      </div>
    );
  }

  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  return (
    <div className="flex flex-col gap-8">
      {back}

      {/* Team header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Image
          src={crest}
          alt=""
          width={80}
          height={80}
          // The school logo may be an uploaded remote URL with no configured image host.
          unoptimized={crest.startsWith("http")}
          className="size-20 shrink-0 rounded-full object-cover bg-black/40 p-1 border-2"
          style={{ borderColor: team.ring }}
        />
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display font-black text-[32px] sm:text-[40px] uppercase text-white leading-none">
              {team.name}
            </h2>
            <StatusPill label={team.status} color={team.status === "Active" ? "bg-success" : "bg-white/30"} />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/75">
            {team.schoolName && <span>{team.schoolName}</span>}
            <span className="flex items-center gap-1.5">
              <Image src={sportIcon(team.sport)} alt="" width={16} height={16} />
              {team.sport}
            </span>
            <span>{team.level}</span>
            <span>{`Head Coach: ${headCoach}`}</span>
          </div>
        </div>
      </div>

      {/* Roster tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
          counts={{ Players: players.length, Parents: parents.length, Staff: staff.length, Followers: followers.length }}
        />
        {tab === "Players" ? (
          <PeopleList
            key={tab}
            rows={players}
            loading={rosterLoading}
            columns={PLAYER_COLUMNS}
            getKey={(a) => a.id}
            searchFields={playerSearch}
            noun="players"
            action={
              <Button
              variant="cta"
              label="Add Player"
              icon={<Plus className="size-5" strokeWidth={2} />}
              className="shrink-0"
              onClick={comingSoon}
            />
            }
          />
        ) : tab === "Parents" ? (
          <ParentsTab rows={parents} loading={rosterLoading} />
        ) : tab === "Staff" ? (
          <StaffTab teamId={team.id} staff={staff} loading={staffLoading} reload={reloadStaff} />
        ) : (
          <PeopleList
            key={tab}
            rows={followers}
            loading={followersLoading}
            columns={FOLLOWER_COLUMNS}
            getKey={(f) => f.id}
            searchFields={followerSearch}
            noun="followers"
          />
        )}
      </div>
    </div>
  );
}
