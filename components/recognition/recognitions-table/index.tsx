"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import { CategoryBadge, TemplateBadge } from "@/components/recognition/recognition-badges";
import { SAMPLE_RECOGNITIONS, type Recognition } from "@/components/recognition/recognitions-data";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";

const PAGE_SIZE = 8;

type FilterKey = "category" | "event" | "status";
const FILTERS: { key: FilterKey; all: string }[] = [
  { key: "category", all: "All Categories" },
  { key: "event", all: "All Games" },
  { key: "status", all: "All Status" },
];

const FILTER_CHIP =
  "size-auto h-12 px-3.5 gap-2 rounded-[8px] outline-0 border border-white/15 bg-white/[0.06] hover:bg-white/10 text-sm text-white whitespace-nowrap";

// Creating, editing and deleting recognitions need the recognitions API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const columns: Column<Recognition>[] = [
  { header: "Category", cls: "w-[104px] shrink-0", cell: (r) => <CategoryBadge category={r.category} /> },
  {
    header: "Recipient",
    cls: "w-[120px] shrink-0",
    cell: (r) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-semibold truncate">{r.recipient}</span>
        {r.number !== undefined && <span className="text-white/60">{`#${r.number}`}</span>}
      </div>
    ),
  },
  { header: "Template", cls: "w-[128px] shrink-0", cell: (r) => <TemplateBadge template={r.template} /> },
  {
    header: "Game / Event",
    cls: "flex-1 min-w-[130px]",
    cell: (r) => <span className="leading-5 text-white/85">{r.event}</span>,
  },
  {
    header: "Status",
    cls: "w-[96px] shrink-0",
    cell: (r) => (
      <StatusPill
        label={r.status}
        color={r.status === "Published" ? "bg-[#1F5F3A]" : "bg-[#5C4A12]"}
        className="h-8 px-2.5 rounded-[6px]"
        textClassName={r.status === "Published" ? "text-[#7BE39A]" : "text-[#F2C94C]"}
      />
    ),
  },
  { header: "Posted By", cls: "w-[106px] shrink-0", cell: (r) => <span className="leading-5">{r.postedBy}</span> },
  {
    header: "Date",
    cls: "w-[104px] shrink-0",
    cell: (r) => (
      <div className="flex flex-col leading-5 whitespace-nowrap">
        <span>{fmtDate(r.date)}</span>
        <span className="text-white/70">{fmtTime(r.date)}</span>
      </div>
    ),
  },
  {
    header: "Actions",
    cls: "w-[72px] shrink-0 justify-center",
    cell: (r) => (
      <RowActionsMenu
        ariaLabel={`Actions for ${r.recipient}`}
        items={[
          { label: "Edit Recognition", onSelect: comingSoon },
          { label: r.status === "Draft" ? "Publish" : "Unpublish", onSelect: comingSoon },
          { label: "Delete", onSelect: comingSoon, variant: "destructive" },
        ]}
      />
    ),
  },
];

// Recognition posts list with filters.
export default function RecognitionsTable() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [page, setPage] = useState(1);

  const options = (key: FilterKey) => [...new Set(SAMPLE_RECOGNITIONS.map((r) => r[key]))].sort();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_RECOGNITIONS.filter(
      (r) =>
        FILTERS.every(({ key }) => !filters[key] || r[key] === filters[key]) &&
        (!q || [r.recipient, r.category, r.template, r.event, r.postedBy].some((v) => v.toLowerCase().includes(q)))
    );
  }, [query, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const setFilter = (key: FilterKey, value?: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          variant="dark"
          placeholder="Search recognitions..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Search recognitions"
          className="w-full sm:w-56"
        />
        {FILTERS.map(({ key, all }) => (
          <RowActionsMenu
            key={key}
            ariaLabel={`Filter by ${all.replace("All ", "").toLowerCase()}`}
            className={FILTER_CHIP}
            trigger={
              <>
                {filters[key] ?? all}
                <ChevronDown className="size-4" strokeWidth={2} />
              </>
            }
            items={[
              { label: all, onSelect: () => setFilter(key) },
              ...options(key).map((v) => ({ label: v, onSelect: () => setFilter(key, v) })),
            ]}
          />
        ))}
        <button type="button" onClick={comingSoon} className={cn(FILTER_CHIP, "flex items-center")}>
          <CalendarDays className="size-5" strokeWidth={1.5} />
          Date Range
          <ChevronDown className="size-4" strokeWidth={2} />
        </button>
        <Button
          variant="cta"
          label="Add Recognition"
          icon={<Plus className="size-5" strokeWidth={2} />}
          className="h-12 ml-auto"
          onClick={() => router.push(routes.ui.addRecognition)}
        />
      </div>

      <div className="rounded-[10px] border border-white/10 overflow-hidden">
        <GenericTable
          columns={columns}
          rows={rows}
          getKey={(r) => r.id}
          empty="No recognitions match these filters."
          headerCellClassName="bg-white/[0.06] h-12"
          cellClassName="bg-transparent py-5"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-sm text-white/80">{`Showing ${from} to ${to} of ${filtered.length} recognitions`}</span>
        <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
