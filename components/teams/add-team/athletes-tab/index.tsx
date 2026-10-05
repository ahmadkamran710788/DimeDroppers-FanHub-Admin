"use client";

import { useMemo, useState } from "react";
import { CloudUpload, EllipsisVertical, Filter, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import { athleteColumns } from "@/components/teams/athlete-columns";
import { ATHLETES } from "@/components/teams/data";

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

  const columns = athleteColumns(() => [
    { label: "Edit Athlete", onSelect: comingSoon },
    { label: "Remove Athlete", onSelect: comingSoon, variant: "destructive" },
  ]);

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
