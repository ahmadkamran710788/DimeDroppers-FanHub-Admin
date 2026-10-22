"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import GenericTable, { type Column } from "@/components/common/generic-table";
import type {
  ExposureBracket,
  ExposureDivision,
  ExposurePlayer,
  ExposureStanding,
  ExposureTeam,
  ExposureVenue,
} from "@/utils/types/exposure-event";

// Tables for an Exposure event's data, shared by the Schedule event modal and the Divisions,
// Venues, Standings and Brackets pages.

// ─── Small presentational helpers ───────────────────────────────────────────────

function ExternalAnchor({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
    >
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
}

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : v);

// ─── Per-view tables ────────────────────────────────────────────────────────────

// One row per division: name, gender, order, active and how many brackets it has.
export function DivisionsTable({ divisions }: { divisions: ExposureDivision[] }) {
  const columns: Column<ExposureDivision>[] = [
    { header: "Division", cls: "flex-1", cell: (d) => dash(d.name) },
    { header: "Brackets", cls: "w-24 justify-center", cell: (d) => d.brackets?.length ?? 0 },
    { header: "Status", cls: "w-24", cell: (d) => (d.active ? "Active" : "Inactive") },
  ];
  const rows = [...(divisions ?? [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name));
  return <GenericTable columns={columns} rows={rows} getKey={(d) => d.id} empty="No divisions found for this event." />;
}


export function BracketsTable({ divisions }: { divisions: ExposureDivision[] }) {
  // One row per bracket; divisions without brackets are left out, so an event with none shows the
  // empty state.
  const rows = (divisions ?? []).flatMap((division) =>
    (division.brackets ?? []).map((bracket) => ({ division, bracket: bracket as ExposureBracket | null }))
  );
  const columns: Column<{ division: ExposureDivision; bracket: ExposureBracket | null }>[] = [
    { header: "Division", cls: "w-44", cell: (r) => dash(r.division.name) },
    { header: "Bracket", cls: "flex-1", cell: (r) => dash(r.bracket?.name) },
    { header: "Rounds", cls: "flex-1", cell: (r) => dash(r.bracket?.results?.map((x) => x.Name).join(", ")) },
    {
      header: "Link",
      cls: "w-20 justify-center",
      cell: (r) => (r.bracket?.url ? <ExternalAnchor href={r.bracket.url} label="Open" /> : "—"),
    },
  ];
  return (
    <GenericTable
      columns={columns}
      rows={rows}
      getKey={(r, i) => r.bracket?.id ?? `${r.division.id}-${i}`}
      empty="No brackets found for this event."
    />
  );
}

export function TeamsTable({
  teams,
  onViewPlayers,
}: {
  teams: ExposureTeam[];
  onViewPlayers: (team: ExposureTeam) => void;
}) {
  const columns: Column<ExposureTeam>[] = [
    { header: "Team", cls: "flex-1", cell: (t) => dash(t.name) },
    { header: "Division", cls: "w-32", cell: (t) => dash(t.divisionName) },
    { header: "Pool", cls: "w-24", cell: (t) => dash(t.pool) },
    { header: "Age", cls: "w-16", cell: (t) => dash(t.age) },
    { header: "Grade", cls: "w-16", cell: (t) => dash(t.grade) },
    {
      header: "Players",
      cls: "w-24 justify-center",
      cell: (t) => (
        <button
          type="button"
          onClick={() => onViewPlayers(t)}
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
          aria-label={`View players for ${t.name}`}
        >
          <span>{t._count?.players ?? 0}</span>
          <ChevronRight className="w-3 h-3 shrink-0" />
        </button>
      ),
    },
  ];
  return <GenericTable columns={columns} rows={teams} getKey={(t) => t.id} empty="No teams found for this event." />;
}

export function PlayersTable({ players }: { players: ExposurePlayer[] }) {
  const columns: Column<ExposurePlayer>[] = [
    { header: "Name", cls: "flex-1", cell: (p) => dash([p.firstName, p.lastName].filter(Boolean).join(" ")) },
    { header: "Pos", cls: "w-16", cell: (p) => dash(p.position) },
    { header: "Grade", cls: "w-16", cell: (p) => dash(p.grade) },
    { header: "Grad Yr", cls: "w-20", cell: (p) => dash(p.graduationYear) },
    { header: "Ht", cls: "w-16", cell: (p) => dash(p.height) },
    { header: "Wt", cls: "w-16", cell: (p) => dash(p.weight) },
    { header: "School", cls: "flex-1", cell: (p) => dash(p.playerSchool) },
  ];
  return <GenericTable columns={columns} rows={players} getKey={(p) => p.id} empty="No players found for this team." />;
}

export function StandingsTable({ standings }: { standings: ExposureStanding[] }) {
  // Stat columns are dynamic — collect the union of `columns` keys, the usual ones in the usual order
  // (W, L, T, PF, PA, PD) and any others after them in first-seen order.
  const seen: string[] = [];
  for (const s of standings) {
    if (s.columns) for (const k of Object.keys(s.columns)) if (!seen.includes(k)) seen.push(k);
  }
  const usual = ["W", "L", "T", "PF", "PA", "PD"];
  const statKeys = [...usual.filter((k) => seen.includes(k)), ...seen.filter((k) => !usual.includes(k))];
  const columns: Column<ExposureStanding>[] = [
    { header: "Place", cls: "w-16 justify-center", cell: (s) => dash(s.place) },
    { header: "Team", cls: "flex-1", cell: (s) => dash(s.teamName) },
    { header: "Group", cls: "w-32", cell: (s) => dash(s.groupName) },
    { header: "Pool", cls: "w-28", cell: (s) => dash(s.poolName) },
    ...statKeys.map(
      (key): Column<ExposureStanding> => ({
        header: key,
        cls: "w-14 justify-center",
        cell: (s) => dash(s.columns?.[key]),
      })
    ),
  ];
  return <GenericTable columns={columns} rows={standings} getKey={(s) => s.id} empty="No standings found for this event." />;
}

export function VenuesTable({ venues }: { venues: ExposureVenue[] }) {
  const columns: Column<ExposureVenue>[] = [
    { header: "Venue", cls: "flex-1", cell: (v) => dash(v.name) },
    { header: "Abbr", cls: "w-20", cell: (v) => dash(v.abbr) },
    {
      header: "Address",
      cls: "flex-1",
      cell: (v) => dash([v.streetAddress, v.city, v.state, v.postalCode].filter(Boolean).join(", ")),
    },
    {
      header: "Courts",
      cls: "w-44",
      cell: (v) => (v.courts?.length ? `${v.courts.length} (${v.courts.map((c) => c.Name).join(", ")})` : "—"),
    },
    {
      header: "Map",
      cls: "w-16 justify-center",
      cell: (v) =>
        v.latitude != null && v.longitude != null ? (
          <ExternalAnchor href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`} label="Map" />
        ) : (
          "—"
        ),
    },
  ];
  return <GenericTable columns={columns} rows={venues} getKey={(v) => v.id} empty="No venues found for this event." />;
}

