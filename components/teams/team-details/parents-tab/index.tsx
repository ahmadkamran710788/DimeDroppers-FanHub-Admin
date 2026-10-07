"use client";

import type { Column } from "@/components/common/generic-table";
import { PARENTS, type Parent } from "@/components/teams/data";
import PeopleList from "@/components/teams/team-details/people-list";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const COLUMNS: Column<Parent>[] = [
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
  {
    header: "Athlete",
    cls: "w-40 shrink-0 py-5",
    cell: (p) => <span className="leading-5">{`#${p.jersey} ${p.athlete}`}</span>,
  },
  { header: "Relationship", cls: "w-28 shrink-0 py-5", cell: (p) => p.relationship },
  { header: "Phone", cls: "w-36 shrink-0 py-5 whitespace-nowrap", cell: (p) => p.phone },
];

const search = (p: Parent) => [p.name, p.email, p.athlete, p.relationship];

// Team Details → Parents: parents and guardians linked to the team's athletes (sample data until a parents API exists).
export default function ParentsTab() {
  return <PeopleList rows={PARENTS} columns={COLUMNS} getKey={(p) => p.id} searchFields={search} noun="parents" invitee={(p) => ({ name: p.name, email: p.email })} />;
}
