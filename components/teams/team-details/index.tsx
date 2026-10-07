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
import { athleteColumns } from "@/components/teams/athlete-columns";
import {
  ATHLETES,
  FOLLOWERS,
  PARENTS,
  SPORT_ICON,
  STAFF,
  TEAMS,
  type Athlete,
  type Follower,
  type StaffMember,
} from "@/components/teams/data";
import AddPlayerModal from "@/components/teams/team-details/add-player-modal";
import AddStaffModal from "@/components/teams/team-details/add-staff-modal";
import ParentsTab from "@/components/teams/team-details/parents-tab";
import PeopleList from "@/components/teams/team-details/people-list";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";

const TABS = ["Players", "Parents", "Staff", "Followers"] as const;
type Tab = (typeof TABS)[number];

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function PersonCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
        {initials(name)}
      </span>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold text-white truncate">{name}</span>
        <span className="text-xs text-white/40 truncate">{email}</span>
      </div>
    </div>
  );
}

const PLAYER_COLUMNS = athleteColumns();
const playerSearch = (a: Athlete) => [a.name, a.email, a.position, String(a.jersey)];

const STAFF_COLUMNS: Column<StaffMember>[] = [
  { header: "Name", cls: "flex-1 min-w-[200px] py-5", cell: (s) => <PersonCell name={s.name} email={s.email} /> },
  { header: "Role", cls: "w-40 shrink-0 py-5", cell: (s) => <span className="leading-5">{s.role}</span> },
  { header: "Phone", cls: "w-36 shrink-0 py-5", cell: (s) => s.phone || "—" },
  {
    header: "Status",
    cls: "w-24 shrink-0 py-5",
    cell: (s) => <StatusPill label={s.status} color={s.status === "Active" ? "bg-success" : "bg-white/30"} />,
  },
];
const staffSearch = (s: StaffMember) => [s.name, s.email, s.role];

const FOLLOWER_COLUMNS: Column<Follower>[] = [
  { header: "Name", cls: "flex-1 min-w-[200px] py-5", cell: (f) => <PersonCell name={f.name} email={f.email} /> },
  { header: "Type", cls: "w-28 shrink-0 py-5", cell: (f) => f.type },
  {
    header: "Following Since",
    cls: "w-36 shrink-0 py-5",
    cell: (f) =>
      new Date(`${f.followingSince}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  },
];
const followerSearch = (f: Follower) => [f.name, f.email, f.type];

// Team details: header plus Players / Staff / Followers lists (sample data until team APIs exist).
export default function TeamDetailsPage({ teamId }: { teamId: string }) {
  const { savedSchool } = useSetup();
  const [tab, setTab] = useState<Tab>("Players");
  // Players live in state so new ones show up right away (sample data until a roster API exists).
  const [players, setPlayers] = useState<Athlete[]>(ATHLETES);
  const [addOpen, setAddOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>(STAFF);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const team = TEAMS.find((t) => t.id === teamId);

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
        <p className="py-16 text-center text-sm text-white/60">This team could not be found.</p>
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
            <span>{team.schoolName}</span>
            <span className="flex items-center gap-1.5">
              <Image src={SPORT_ICON[team.sport]} alt="" width={16} height={16} />
              {team.sport}
            </span>
            <span>{team.level}</span>
            <span>{`Head Coach: ${team.headCoach}`}</span>
          </div>
        </div>
      </div>

      {/* Roster tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
          counts={{ Players: players.length, Parents: PARENTS.length, Staff: staff.length, Followers: FOLLOWERS.length }}
        />
        {tab === "Players" ? (
          <PeopleList
            key={tab}
            rows={players}
            columns={PLAYER_COLUMNS}
            getKey={(a) => a.id}
            searchFields={playerSearch}
            noun="players"
            invitee={(p) => ({ name: p.name, email: p.email })}
            action={
              <Button
                variant="cta"
                label="Add Player"
                icon={<Plus className="size-5" strokeWidth={2} />}
                className="shrink-0"
                onClick={() => setAddOpen(true)}
              />
            }
          />
        ) : tab === "Parents" ? (
          <ParentsTab />
        ) : tab === "Staff" ? (
          <PeopleList
            key={tab}
            rows={staff}
            columns={STAFF_COLUMNS}
            getKey={(s) => s.id}
            searchFields={staffSearch}
            noun="staff"
            invitee={(p) => ({ name: p.name, email: p.email })}
            action={
              <Button
                variant="cta"
                label="Add Staff"
                icon={<Plus className="size-5" strokeWidth={2} />}
                className="shrink-0"
                onClick={() => setAddStaffOpen(true)}
              />
            }
          />
        ) : (
          <PeopleList
            key={tab}
            rows={FOLLOWERS}
            columns={FOLLOWER_COLUMNS}
            getKey={(f) => f.id}
            searchFields={followerSearch}
            noun="followers"
            invitee={(p) => ({ name: p.name, email: p.email })}
          />
        )}
      </div>

      <AddPlayerModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        sport={team.sport}
        takenJerseys={players.map((p) => p.jersey)}
        onAdd={(player) => {
          setPlayers((prev) => [player, ...prev]);
          toast.success(`${player.name} added to the roster`);
        }}
      />

      <AddStaffModal
        isOpen={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        onAdd={(member) => {
          // A team has one head coach: adding a new one moves the current one to assistant.
          setStaff((prev) => [
            member,
            ...prev.map((s) =>
              member.role === "Head Coach" && s.role === "Head Coach" ? { ...s, role: "Assistant Coach" } : s
            ),
          ]);
          toast.success(`${member.name} added as ${member.role.toLowerCase()}`);
        }}
      />
    </div>
  );
}
