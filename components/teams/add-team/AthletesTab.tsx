"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CloudUpload, EllipsisVertical, Filter, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import { ATHLETES, type Athlete } from "@/components/teams/data";

const PAGE_SIZE = 10;

// Athlete import / create / edit flows come in later screens.
const comingSoon = () => toast("Coming soon.");

export default function AthletesTab() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ATHLETES;
    return ATHLETES.filter((a) =>
      [a.name, a.email, a.position, String(a.jersey)].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const columns: Column<Athlete>[] = [
    {
      header: "Athlete",
      cls: "flex-1 min-w-[180px] py-5",
      cell: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <Image src={a.avatar} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{a.name}</span>
            <span className="text-xs text-white/40 truncate">{a.email}</span>
          </div>
        </div>
      ),
    },
    { header: "Jersey #", cls: "w-16 shrink-0 py-5", cell: (a) => a.jersey },
    { header: "Position", cls: "w-20 shrink-0 py-5", cell: (a) => <span className="leading-5">{a.position}</span> },
    { header: "Graduated", cls: "w-20 shrink-0 py-5", cell: (a) => a.graduated },
    {
      header: "Status",
      cls: "w-20 shrink-0 py-5",
      cell: (a) => <StatusPill label={a.status} color={a.status === "Active" ? "bg-success" : "bg-white/30"} />,
    },
    {
      header: "Actions",
      cls: "w-16 shrink-0 py-5 justify-end",
      cell: (a) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${a.name}`}
          className="bg-white/25 hover:bg-white/35"
          items={[
            { label: "Edit Athlete", onSelect: comingSoon },
            { label: "Remove Athlete", onSelect: comingSoon, variant: "destructive" },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search + filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Search athletes"
        />
        <Button
          variant="ghost"
          label="Filters"
          icon={<Filter className="w-5 h-5" />}
          className="shrink-0 min-w-0 px-4"
          onClick={comingSoon}
        />
      </div>

      {/* Import actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-medium text-white">
        <div className="flex flex-wrap items-center gap-6">
          <button type="button" onClick={comingSoon} className="flex items-center gap-2 hover:text-white/80 transition-colors">
            <CloudUpload className="w-5 h-5" />
            Import CSV
          </button>
          <button type="button" onClick={comingSoon} className="flex items-center gap-2 hover:text-white/80 transition-colors">
            <Upload className="w-5 h-5" />
            Import from Teamsnap
          </button>
        </div>
        <button type="button" onClick={comingSoon} className="flex items-center gap-1 hover:text-white/80 transition-colors">
          <EllipsisVertical className="w-5 h-5" />
          More Options
        </button>
      </div>

      {/* Title + add */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display font-black text-xl lg:text-2xl uppercase text-white leading-tight">Athletes</h3>
        <Button variant="ghost" label="Add Athlete" className="min-w-0 px-4" onClick={comingSoon} />
      </div>

      <div className="flex flex-col">
        <GenericTable columns={columns} rows={rows} getKey={(a) => a.id} empty="No athletes match your search." />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
          <span className="text-xs text-white/80">
            Showing {from} to {to} of {filtered.length} athletes
          </span>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
