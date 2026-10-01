"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SegmentedControl from "@/components/common/segmented-control";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import { MEDIA_TYPE_COLOR, SAMPLE_MEDIA, type MediaItem, type MediaType } from "@/components/media/data";

const SECTIONS = ["Media", "Insights"] as const;
type Section = (typeof SECTIONS)[number];

const PAGE_SIZE = 8;
const TABS = ["All Media", "Photos", "Videos", "Fan Wall"] as const;
type Tab = (typeof TABS)[number];

// Photos / Videos (tab or type filter) narrow the list to one type; Fan Wall has its own design.
const LABEL_TYPE: Partial<Record<string, MediaType>> = { Photos: "Photo", Videos: "Video" };

const TYPE_FILTERS = ["All Media Types", "Photos", "Videos"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

// Upload and row actions need the media API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(" ", "");

const columns: Column<MediaItem>[] = [
  {
    header: "Preview",
    cls: "w-[123px] shrink-0",
    cell: (m) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.preview} alt="" className="h-28 w-[107px] shrink-0 object-cover" />
    ),
  },
  {
    header: "Name",
    cls: "w-[129px] shrink-0",
    cell: (m) => (
      <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
        <span className="font-semibold leading-[18px] truncate">{m.name}</span>
        <span className="leading-[19px] opacity-40">{m.format}</span>
      </div>
    ),
  },
  {
    header: "Type",
    cls: "w-[69px] shrink-0",
    cell: (m) => (
      <StatusPill
        label={m.type}
        color={MEDIA_TYPE_COLOR[m.type]}
        className="px-2 backdrop-blur-[52px]"
        textClassName="text-white"
      />
    ),
  },
  {
    header: "Tags",
    cls: "w-[100px] shrink-0",
    cell: (m) => <span className="leading-5 capitalize">{m.tags.join(", ")}</span>,
  },
  {
    header: "Uploaded By",
    cls: "w-[100px] shrink-0",
    cell: (m) => <span className="leading-4 capitalize">{m.uploadedBy}</span>,
  },
  {
    header: "Date",
    cls: "flex-1 min-w-[100px]",
    cell: (m) => (
      <div className="flex flex-col leading-5">
        <span>{fmtDate(m.uploadedAt)}</span>
        <span>{fmtTime(m.uploadedAt)}</span>
      </div>
    ),
  },
  {
    header: "Actions",
    cls: "w-[73px] shrink-0 justify-center",
    cell: (m) => (
      <RowActionsMenu
        ariaLabel={`Actions for ${m.name}`}
        className="h-12 w-[50px] px-3 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 backdrop-blur-[24px]"
        items={[
          { label: "View Media", onSelect: comingSoon },
          { label: "Download", onSelect: comingSoon },
          { label: "Delete Media", onSelect: comingSoon, variant: "destructive" },
        ]}
      />
    ),
  },
];

export default function MediaPage() {
  const [section, setSection] = useState<Section>("Media");
  const [tab, setTab] = useState<Tab>("All Media");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All Media Types");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tabType = LABEL_TYPE[tab];
    const filterType = LABEL_TYPE[typeFilter];
    return SAMPLE_MEDIA.filter(
      (m) =>
        (!tabType || m.type === tabType) &&
        (!filterType || m.type === filterType) &&
        (!q || [m.name, m.uploadedBy, ...m.tags].some((v) => v.toLowerCase().includes(q)))
    );
  }, [tab, typeFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-10">
      {/* Title + upload */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Media
          </h2>
          <p className="text-base leading-[26px]">Manage and organize team photos, videos, and fan content.</p>
        </div>
        <Button variant="cta" label="Upload Media" className="shrink-0 whitespace-nowrap w-[177px]" onClick={comingSoon} />
      </div>

      <SegmentedControl options={SECTIONS} active={section} onChange={setSection} ariaLabel="Media sections" />

      {section === "Insights" ? (
        // Recaps, insights etc. land here once that design is ready.
        <div className="rounded-[8px] p-6 backdrop-blur-[24px] bg-surface-06">
          <p className="py-12 text-center text-sm text-white/40">Insights and recaps are coming soon.</p>
        </div>
      ) : (
        // Media library
        <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
          <Tabs
            tabs={TABS}
            active={tab}
            onChange={(t) => {
              setTab(t);
              setPage(1);
            }}
          />

          {tab === "Fan Wall" ? (
            <p className="py-12 text-center text-sm text-white/40">Fan Wall is coming soon.</p>
          ) : (
            <>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-6">
                <SearchInput
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Search media"
                />
                <RowActionsMenu
                  ariaLabel="Filter by media type"
                  className="w-auto h-12 px-3 gap-2 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 backdrop-blur-[24px] text-base font-medium text-white whitespace-nowrap"
                  trigger={
                    <>
                      {typeFilter}
                      <ChevronDown className="w-6 h-6" />
                    </>
                  }
                  items={TYPE_FILTERS.map((f) => ({
                    label: f,
                    onSelect: () => {
                      setTypeFilter(f);
                      setPage(1);
                    },
                  }))}
                />
                <Button
                  variant="ghost"
                  label="Filters"
                  icon={<Filter className="w-5 h-5" />}
                  className="shrink-0 min-w-0 w-[112px] px-3"
                  onClick={comingSoon}
                />
              </div>

              <div className="flex flex-col">
                <GenericTable
                  columns={columns}
                  rows={rows}
                  getKey={(m) => m.id}
                  empty={query ? "No media matches your search." : "No media uploaded yet."}
                  headerCellClassName="bg-white/[0.08]"
                  cellClassName="bg-white/[0.04] py-4"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <span className="text-xs text-white/80">
                    Showing {from} to {to} of {filtered.length} files
                  </span>
                  <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
