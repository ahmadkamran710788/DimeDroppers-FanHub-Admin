"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Filter, GripVertical, Info } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatCard from "@/components/common/stat-card";
import Tabs from "@/components/common/tabs";
import {
  ADD_ON_STATUSES,
  ADD_ON_STATUS_COLOR,
  SAMPLE_ADD_ONS,
  SAMPLE_STATS,
  type AddOn,
  type AddOnStatus,
} from "@/components/sponsors/add-ons/data";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";

const PAGE_SIZE = 10;
const TABS = ["All Options", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];

// Creating, editing and reordering add-ons need the add-ons API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

export default function AddOnsPage() {
  // Kept in state so the status dropdown updates the row until there's an API to save to.
  const [addOns, setAddOns] = useState<AddOn[]>(SAMPLE_ADD_ONS);
  const [tab, setTab] = useState<Tab>("All Options");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const setStatus = (id: string, status: AddOnStatus) =>
    setAddOns((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return addOns.filter(
      (a) =>
        (tab === "All Options" || a.status === tab) &&
        (!q || [a.name, a.description].some((v) => v.toLowerCase().includes(q)))
    );
  }, [addOns, tab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const columns: Column<AddOn>[] = [
    {
      header: "Add-On Items",
      cls: "flex-1 min-w-[240px]",
      cell: (a) => (
        <div className="flex items-start gap-2 min-w-0">
          <GripVertical className="size-6 shrink-0 text-white/60" strokeWidth={1.5} aria-hidden />
          <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
            <span className="font-semibold leading-[18px]">{a.name}</span>
            <span className="leading-[19px] opacity-40">{a.description}</span>
          </div>
        </div>
      ),
    },
    { header: "Price", cls: "w-[62px] shrink-0", cell: (a) => <span className="leading-4">{formatMoney(a.price)}</span> },
    {
      header: "Status",
      cls: "w-[94px] shrink-0",
      cell: (a) => (
        <RowActionsMenu
          ariaLabel={`Change status of ${a.name}`}
          className={cn(
            "size-auto h-6 px-2 gap-2 rounded-full outline-0 backdrop-blur-[52px] text-xs font-medium text-midnight-navy hover:opacity-80",
            ADD_ON_STATUS_COLOR[a.status]
          )}
          trigger={
            <>
              {a.status}
              <ChevronDown className="size-4" strokeWidth={2.5} />
            </>
          }
          items={ADD_ON_STATUSES.map((status) => ({ label: status, onSelect: () => setStatus(a.id, status) }))}
        />
      ),
    },
    {
      header: "Display Order",
      cls: "w-[70px] shrink-0",
      cell: (a) => (
        <span className="h-12 w-10 flex items-center justify-center rounded-[8px] border border-white/25 bg-[rgba(235,235,235,0.25)] backdrop-blur-[24px] text-base font-medium text-white">
          {a.displayOrder}
        </span>
      ),
    },
    {
      header: "Used In",
      cls: "w-[93px] shrink-0",
      cell: (a) => <span className="leading-5">{`${a.packages} Packages`}</span>,
    },
    {
      header: "Actions",
      cls: "w-[73px] shrink-0 justify-center",
      cell: (a) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${a.name}`}
          className="h-12 w-[50px] px-3 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 backdrop-blur-[24px]"
          items={[
            { label: "Edit Add-On", onSelect: comingSoon },
            { label: "Delete Add-On", onSelect: comingSoon, variant: "destructive" },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <Link
        href={routes.ui.sponsors}
        className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
      >
        <ArrowLeft className="size-6" strokeWidth={1.5} />
        Back to Sponsors
      </Link>

      {/* Title + add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Add-Ons
          </h2>
          <p className="text-base leading-[26px]">Add individual sponsorship items to be included in your packages</p>
        </div>
        <Button variant="cta" label="Add Add-On" className="shrink-0 whitespace-nowrap w-[177px]" onClick={comingSoon} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {SAMPLE_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Add-ons list */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        <div className="flex items-center gap-6">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search add-ons"
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
            getKey={(a) => a.id}
            empty={query ? "No add-ons match your search." : "No add-ons yet."}
            headerCellClassName="bg-white/[0.08]"
            cellClassName="bg-white/[0.04] py-4"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <span className="text-xs text-white/80">
              Showing {from} to {to} of {filtered.length} add-ons
            </span>
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <div className="flex items-start gap-2 text-white">
          <Info className="size-10 shrink-0" strokeWidth={1.5} />
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl leading-8 font-bold">{"About Add-On's Options"}</h3>
            <p className="text-base leading-6">Add-On options that sponsors can include with their sponsorship packages.</p>
            <p className="text-base leading-6 mt-6">Set competitive pricing and clear descriptions to maximize value.</p>
          </div>
        </div>
        <hr className="border-white/10" />
        <Button label="Learn More" className="w-full sm:w-[257px]" onClick={comingSoon} />
      </div>
    </div>
  );
}
