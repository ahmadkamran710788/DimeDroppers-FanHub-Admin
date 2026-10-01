"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import DonutBreakdown from "@/components/common/donut-breakdown";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RankedList from "@/components/common/ranked-list";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatCard from "@/components/common/stat-card";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import {
  SAMPLE_BREAKDOWN,
  SAMPLE_BREAKDOWN_TOTAL,
  SAMPLE_SPONSORS,
  SAMPLE_STATS,
  SAMPLE_TOP_SPONSORS,
  STATUS_COLOR,
  TIER_COLOR,
  type Sponsor,
  type SponsorStatus,
} from "@/components/sponsors/data";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";

const PAGE_SIZE = 16;
const TABS = ["All Sponsors", "Active", "Pending", "Expired", "Inactive"] as const;
type Tab = (typeof TABS)[number];

// Sponsor actions need the sponsors API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

const columns: Column<Sponsor>[] = [
  {
    header: "Sponsor",
    cls: "flex-1 min-w-[200px]",
    cell: (s) => (
      <div className="flex items-start gap-2 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.logo}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover border border-white/50 bg-white/15 backdrop-blur-[10px]"
        />
        <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
          <span className="font-semibold leading-[18px] truncate">{s.name}</span>
          <span className="leading-[19px] opacity-40">{s.role}</span>
          {s.featured && (
            <StatusPill
              label="Featured"
              color="bg-[#FF34BF]"
              className="self-start px-2 backdrop-blur-[52px]"
              textClassName="text-white"
            />
          )}
        </div>
      </div>
    ),
  },
  { header: "Cat.", cls: "w-[62px] shrink-0", cell: (s) => <span className="leading-4 capitalize">{s.category}</span> },
  {
    header: "Tier",
    cls: "w-[82px] shrink-0",
    cell: (s) => (
      <StatusPill label={s.tier} color={TIER_COLOR[s.tier]} className="px-2 backdrop-blur-[52px]" textClassName="text-white" />
    ),
  },
  {
    header: "Status",
    cls: "w-[68px] shrink-0",
    cell: (s) => (
      <StatusPill
        label={s.status}
        color={STATUS_COLOR[s.status]}
        className="px-2 backdrop-blur-[52px]"
        textClassName="text-midnight-navy"
      />
    ),
  },
  { header: "Value", cls: "w-[77px] shrink-0", cell: (s) => <span className="leading-4">{formatMoney(s.value)}</span> },
  {
    header: "Engagement",
    cls: "w-[126px] shrink-0",
    cell: (s) => (
      <div className="flex flex-col leading-5">
        <span>{s.interactions}</span>
        <span>Interactions</span>
      </div>
    ),
  },
  {
    header: "Actions",
    cls: "w-[73px] shrink-0 justify-center",
    cell: (s) => (
      <RowActionsMenu
        ariaLabel={`Actions for ${s.name}`}
        className="h-12 w-[50px] px-3 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 backdrop-blur-[24px]"
        items={[
          { label: "View Sponsor", onSelect: comingSoon },
          { label: "Edit Sponsor", onSelect: comingSoon },
          { label: "Remove Sponsor", onSelect: comingSoon, variant: "destructive" },
        ]}
      />
    ),
  },
];

export default function SponsorsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("All Sponsors");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_SPONSORS.filter(
      (s) =>
        (tab === "All Sponsors" || s.status === (tab as SponsorStatus)) &&
        (!q || [s.name, s.role, s.category, s.tier].some((v) => v.toLowerCase().includes(q)))
    );
  }, [tab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-10">
      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Sponsors
          </h2>
          <p className="text-base leading-[26px]">Manage your sponsors, partnerships, and sponsorship assets.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Button
            label="Add Add-On"
            className="shrink-0 whitespace-nowrap w-[177px]"
            onClick={() => router.push(routes.ui.sponsorAddOns)}
          />
          <Button
            variant="cta"
            label="Add Sponsor"
            className="shrink-0 whitespace-nowrap w-[177px]"
            onClick={() => router.push(routes.ui.addSponsor)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {SAMPLE_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_348px] gap-10 items-start">
        {/* Sponsors list */}
        <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06 min-w-0">
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
              aria-label="Search sponsors"
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
              getKey={(s) => s.id}
              empty={query ? "No sponsors match your search." : "No sponsors yet."}
              headerCellClassName="bg-white/[0.08]"
              cellClassName="bg-white/[0.04] py-4"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <span className="text-xs text-white/80">
                Showing {from} to {to} of {filtered.length} sponsors
              </span>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-10 items-start">
          <DonutBreakdown
            title="Sponsor Breakdown"
            centerValue={String(SAMPLE_BREAKDOWN_TOTAL)}
            centerLabel="Total"
            slices={SAMPLE_BREAKDOWN}
            actionLabel="View Sponsorship Reports"
            onAction={comingSoon}
          />
          <RankedList title="Top Sponsors by Value" items={SAMPLE_TOP_SPONSORS} onViewAll={comingSoon} />
        </div>
      </div>
    </div>
  );
}
