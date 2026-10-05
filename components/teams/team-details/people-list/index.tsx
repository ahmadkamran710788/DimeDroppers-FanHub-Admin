"use client";

import { useMemo, useState, type ReactNode } from "react";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";

const PAGE_SIZE = 10;

interface PeopleListProps<T> {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  // Text fields matched by the search box.
  searchFields: (row: T) => string[];
  // Plural noun for the search label and footer, e.g. "players".
  noun: string;
  // Optional toolbar action next to the search box (e.g. "Add Player").
  action?: ReactNode;
}

// Searchable, paginated list for one Team Details tab (players, staff or followers).
export default function PeopleList<T>({ rows, columns, getKey, searchFields, noun, action }: PeopleListProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchFields(r).some((v) => v.toLowerCase().includes(q)));
  }, [rows, query, searchFields]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${noun}`}
          aria-label={`Search ${noun}`}
          className="sm:max-w-sm"
        />
        {action}
      </div>
      <div className="flex flex-col">
        <GenericTable columns={columns} rows={visible} getKey={getKey} empty={`No ${noun} match your search.`} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
          <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${filtered.length} ${noun}`}</span>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
