"use client";

import type { Column } from "@/components/common/generic-table";
import StatusPill from "@/components/common/status-pill";
import { invitationColor } from "@/components/teams/team-details/invitation-status";
import PeopleList from "@/components/teams/team-details/people-list";
import type { RosterParent } from "@/components/teams/team-details/use-team-players";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const COLUMNS: Column<RosterParent>[] = [
  {
    header: "Parent",
    cls: "flex-1 min-w-[200px] py-5",
    cell: (p) => (
      <div className="flex items-center gap-3 min-w-0">
        <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
          {initials(p.name)}
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold text-white truncate">{p.name}</span>
          <span className="text-xs text-white/40 truncate">{p.email}</span>
        </div>
      </div>
    ),
  },
  { header: "Player", cls: "w-44 shrink-0 py-5", cell: (p) => <span className="leading-5">{p.player}</span> },
  { header: "Phone", cls: "w-36 shrink-0 py-5 whitespace-nowrap", cell: (p) => p.phone || "—" },
  {
    header: "Status",
    cls: "w-28 shrink-0 py-5",
    cell: (p) => <StatusPill label={p.status} color={invitationColor(p.status)} className="whitespace-nowrap" />,
  },
];

const search = (p: RosterParent) => [p.name, p.email, p.player];

interface ParentsTabProps {
  rows: RosterParent[];
  loading: boolean;
}

// Team Details → Parents: the parents the coach added to the team's players (read-only).
export default function ParentsTab({ rows, loading }: ParentsTabProps) {
  return <PeopleList rows={rows} loading={loading} columns={COLUMNS} getKey={(p) => p.id} searchFields={search} noun="parents" />;
}
