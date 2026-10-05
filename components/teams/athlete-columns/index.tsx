import Image from "next/image";
import type { Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import type { Athlete } from "@/components/teams/data";

// Roster table columns shared by Add Team → Athletes and Team Details → Players.
// Pass `actions` to add a per-row actions menu.
export function athleteColumns(actions?: (a: Athlete) => RowAction[]): Column<Athlete>[] {
  const columns: Column<Athlete>[] = [
    {
      header: "Athlete",
      cls: "flex-1 min-w-[180px] py-5",
      cell: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          {a.avatar ? (
            <Image src={a.avatar} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
          ) : (
            // Newly added players have no photo yet.
            <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
              {a.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{a.name}</span>
            <span className="text-xs text-white/40 truncate">{a.email}</span>
          </div>
        </div>
      ),
    },
    { header: "Jersey #", cls: "w-20 shrink-0 py-5 whitespace-nowrap", cell: (a) => a.jersey },
    { header: "Position", cls: "w-20 shrink-0 py-5", cell: (a) => <span className="leading-5">{a.position}</span> },
    { header: "Graduated", cls: "w-20 shrink-0 py-5", cell: (a) => a.graduated },
    {
      header: "Status",
      cls: "w-20 shrink-0 py-5",
      cell: (a) => <StatusPill label={a.status} color={a.status === "Active" ? "bg-success" : "bg-white/30"} />,
    },
  ];
  if (actions) {
    columns.push({
      header: "Actions",
      cls: "w-16 shrink-0 py-5 justify-end",
      cell: (a) => (
        <RowActionsMenu ariaLabel={`Actions for ${a.name}`} className="bg-white/25 hover:bg-white/35" items={actions(a)} />
      ),
    });
  }
  return columns;
}
