"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { SPORT_ICON, TEAMS, type Team } from "@/components/teams/data";

const PAGE_SIZE = 10;

// Backend actions for teams aren't available yet (Add / View / Edit / Delete come in 3.2+).
const comingSoon = () => toast("Coming soon.");

interface TeamsTableProps {
  // Shows the "Teams (n)" toggle that collapses the table (Teams page only).
  collapsible?: boolean;
  // Campaign names per team id. When given, adds a "Campaigns" dropdown column (Fundraising).
  campaignsByTeam?: Record<string, string[]>;
}

// Searchable, paginated teams list shared by the Teams page and the Fundraising "Teams" tab.
export default function TeamsTable({ collapsible = false, campaignsByTeam }: TeamsTableProps) {
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
    ...(campaignsByTeam
      ? [
          {
            header: "Campaigns",
            cls: "w-36 shrink-0 py-5",
            cell: (t: Team) => {
              const names = campaignsByTeam[t.id] ?? [];
              if (names.length === 0) return <span className="text-white/40">No campaigns</span>;
              return (
                <RowActionsMenu
                  ariaLabel={`Campaigns for ${t.name}`}
                  className="w-auto h-9 px-3 gap-1 text-xs font-medium text-white whitespace-nowrap"
                  trigger={
                    <>
                      {names.length} {names.length === 1 ? "Campaign" : "Campaigns"}
                      <ChevronDown className="w-4 h-4" />
                    </>
                  }
                  items={names.map((label) => ({ label, onSelect: comingSoon }))}
                />
              );
            },
          },
        ]
      : []),
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
    <>
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

      {collapsible && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="self-start flex items-center gap-2 font-display font-black text-[28px] uppercase text-white leading-none"
        >
          Teams ({filtered.length})
          <ChevronDown className={cn("w-6 h-6 transition-transform", collapsed && "-rotate-90")} />
        </button>
      )}

      {!(collapsible && collapsed) && (
        <div className="flex flex-col">
          <GenericTable columns={columns} rows={rows} getKey={(t) => t.id} empty="No teams match your search." />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
            <span className="text-xs text-white/80">
              Showing {from} to {to} of {filtered.length} teams
            </span>
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          </div>
        </div>
      )}
    </>
  );
}
