"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import GenericTable, { type Column } from "@/components/common/GenericTable";
import Pagination from "@/components/common/Pagination";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import SearchInput from "@/components/common/SearchInput";
import StatusPill from "@/components/common/StatusPill";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { useRouter } from "next/navigation";
import { SPORT_ICON, TEAMS, TEAM_STATS, type Team } from "@/components/teams/data";

const PAGE_SIZE = 10;

interface Stat {
  label: string;
  value: number;
  caption: string;
  // Tinted background of the value badge.
  tint: string;
}

function StatCard({ label, value, caption, tint }: Stat) {
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-4 backdrop-blur-[48px] bg-surface-07">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">{label}</h3>
        <span
          className="size-16 shrink-0 rounded-[8px] flex items-center justify-center font-display font-black text-[28px] text-white leading-none"
          style={{ background: tint }}
        >
          {value}
        </span>
      </div>
      <span className="text-xs text-white/80">{caption}</span>
    </div>
  );
}

// Backend actions for teams aren't available yet (Add / View / Edit / Delete come in 3.2+).
const comingSoon = () => toast("Coming soon.");

export default function TeamsPage() {
  const router = useRouter();
  const { savedSchool } = useSetup();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEAMS;
    return TEAMS.filter((t) =>
      [t.name, t.schoolName, t.sport, t.level, t.headCoach].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const stats: Stat[] = [
    { label: "Total Teams", value: TEAMS.length, caption: "All Sports", tint: "rgba(99,139,254,0.5)" },
    {
      label: "Active Teams",
      value: TEAMS.filter((t) => t.status === "Active").length,
      caption: "This Season",
      tint: "rgba(101,193,98,0.4)",
    },
    {
      label: "Total Athletes",
      value: TEAMS.reduce((sum, t) => sum + t.athletes, 0),
      caption: TEAM_STATS.athletesPct,
      tint: "rgba(157,98,193,0.4)",
    },
    {
      label: "Coaches & Staff",
      value: TEAM_STATS.coachesAndStaff,
      caption: TEAM_STATS.coachesAndStaffPct,
      tint: "rgba(193,127,82,0.45)",
    },
  ];

  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  const columns: Column<Team>[] = [
    {
      header: "Team",
      cls: "flex-1 min-w-[240px] py-5",
      cell: (t) => (
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={crest}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover bg-black/40 p-0.5 border-2"
            style={{ borderColor: t.ring }}
          />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{t.name}</span>
            <span className="text-xs text-white/40 truncate">{t.schoolName}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Sport",
      cls: "w-32 shrink-0 py-5",
      cell: (t) => (
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SPORT_ICON[t.sport]} alt="" width={20} height={20} className="shrink-0" />
          {t.sport}
        </span>
      ),
    },
    { header: "Level", cls: "w-20 shrink-0 py-5", cell: (t) => <span className="leading-5">{t.level}</span> },
    { header: "Head Coach", cls: "w-24 shrink-0 py-5", cell: (t) => <span className="leading-5">{t.headCoach}</span> },
    { header: "Athletes", cls: "w-20 shrink-0 py-5", cell: (t) => t.athletes },
    {
      header: "Status",
      cls: "w-24 shrink-0 py-5",
      cell: (t) => (
        <StatusPill label={t.status} color={t.status === "Active" ? "bg-success" : "bg-white/30"} />
      ),
    },
    {
      header: "Actions",
      cls: "w-20 shrink-0 py-5 justify-end",
      cell: (t) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${t.name}`}
          className="bg-white/25 hover:bg-white/35"
          items={[
            { label: "View Team", onSelect: comingSoon },
            { label: "Edit Team", onSelect: comingSoon },
            { label: "Delete Team", onSelect: comingSoon, variant: "destructive" },
          ]}
        />
      ),
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
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Teams list */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <div className="flex items-center gap-4">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search teams"
          />
          <Button
            variant="ghost"
            label="Filters"
            icon={<Filter className="w-5 h-5" />}
            className="shrink-0 min-w-0 px-4"
            onClick={comingSoon}
          />
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="self-start flex items-center gap-2 font-display font-black text-[28px] uppercase text-white leading-none"
        >
          Teams ({filtered.length})
          <ChevronDown className={cn("w-6 h-6 transition-transform", collapsed && "-rotate-90")} />
        </button>

        {!collapsed && (
          <div className="flex flex-col">
            <GenericTable
              columns={columns}
              rows={rows}
              getKey={(t) => t.id}
              empty="No teams match your search."
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
              <span className="text-xs text-white/80">
                Showing {from} to {to} of {filtered.length} teams
              </span>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
