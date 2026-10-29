"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import DonutBreakdown, { type DonutSlice } from "@/components/common/donut-breakdown";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RankedList from "@/components/common/ranked-list";
import SearchInput from "@/components/common/search-input";
import StatCard, { type Stat } from "@/components/common/stat-card";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import PackagesPreview from "@/components/organization/sponsors/packages-preview";
import { storeNames } from "@/components/sponsor/data";
import { formatCents, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageActivation, PackageActivationsPage, PackageActivationStatus } from "@/utils/types/sponsor-packages";

const PAGE_SIZE = 16;
// The side panels and stat cards read the active activations, up to the API's page cap.
const ACTIVE_LIMIT = 100;
const TABS = ["All", "Active", "Expired", "Cancelled"] as const;
type Tab = (typeof TABS)[number];
const TAB_STATUS: Record<Tab, PackageActivationStatus | undefined> = {
  All: undefined,
  Active: "ACTIVE",
  Expired: "EXPIRED",
  Cancelled: "CANCELLED",
};

const STATUS_COLOR: Record<PackageActivationStatus, string> = {
  ACTIVE: "bg-success",
  EXPIRED: "bg-white/30",
  CANCELLED: "bg-error/70",
};

const SLICE_COLORS = ["#3030FF", "#638BFE", "#FF8D2A", "#65C162", "#FF34BF", "rgba(255,255,255,0.1)"];

const sponsorName = (a: PackageActivation) => a.sponsor.brandName || a.sponsor.name || "Sponsor";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const columns: Column<PackageActivation>[] = [
  {
    header: "Sponsor",
    cls: "flex-1 min-w-[180px]",
    cell: (a) => (
      <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
        <span className="font-semibold leading-[18px] truncate">{sponsorName(a)}</span>
        {a.sponsor.brandName && a.sponsor.name && <span className="leading-[19px] opacity-40 truncate">{a.sponsor.name}</span>}
      </div>
    ),
  },
  {
    header: "Package",
    cls: "w-[200px] shrink-0",
    cell: (a) => (
      <div className="flex flex-col gap-1 min-w-0 text-xs">
        <span className="leading-4 break-words">{a.packageName}</span>
        <span className="opacity-50">
          {a.kind === "PHYSICAL_ASSET"
            ? ["Physical asset", a.physicalAsset?.assetCategory?.label, a.physicalAsset?.size].filter(Boolean).join(" · ")
            : "Package"}
        </span>
        {/* The sponsor's stores it is for (as they were when activated). */}
        {a.locations.length > 0 && <span className="opacity-70 break-words">{`For: ${storeNames(a.locations, 2)}`}</span>}
      </div>
    ),
  },
  { header: "Event", cls: "w-[150px] shrink-0", cell: (a) => <span className="leading-4 break-words">{a.event?.name ?? "—"}</span> },
  { header: "Value", cls: "w-[96px] shrink-0", cell: (a) => <span className="leading-4">{formatCents(a.totalCents, a.currency)}</span> },
  {
    header: "Status",
    cls: "w-[96px] shrink-0",
    cell: (a) => (
      <StatusPill label={a.status.charAt(0) + a.status.slice(1).toLowerCase()} color={STATUS_COLOR[a.status]} className="px-2" textClassName="text-white" />
    ),
  },
  { header: "Activated", cls: "w-[110px] shrink-0", cell: (a) => <span className="leading-4">{fmtDate(a.activatedAt)}</span> },
];

interface Loaded {
  key: string;
  page?: PackageActivationsPage;
  error?: string;
}

// Sponsors: who activated which of the organization's packages and physical assets
// (GET /org/sponsor-packages/activations), and what sponsors can buy.
export default function SponsorsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Loaded | null>(null);
  const [active, setActive] = useState<PackageActivationsPage | null>(null);

  // The active ones, for the stat cards and side panels.
  useEffect(() => {
    sponsorRequest<PackageActivationsPage>("GET", routes.api.orgSponsorActivations, {
      params: { status: "ACTIVE", page: 1, limit: ACTIVE_LIMIT },
    }).then((r) => {
      if (r.view) setActive(r.view);
      else toast.error(r.message ?? "Couldn't load your sponsors.");
    });
  }, []);

  const key = `${tab}|${page}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<PackageActivationsPage>("GET", routes.api.orgSponsorActivations, {
      params: { status: TAB_STATUS[tab], page, limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, page: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, tab, page]);

  const loading = list?.key !== key;
  const current = loading ? undefined : list?.page;
  const q = query.trim().toLowerCase();
  // The search narrows the page shown.
  const rows = (current?.items ?? []).filter(
    (a) => !q || [sponsorName(a), a.sponsor.name ?? "", a.packageName, a.event?.name ?? ""].some((v) => v.toLowerCase().includes(q))
  );
  const total = current?.pagination.total ?? 0;
  const pageCount = Math.max(1, current?.pagination.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const activeItems = useMemo(() => active?.items ?? [], [active]);
  const activeValue = activeItems.reduce((sum, a) => sum + a.totalCents, 0);
  const sponsors = new Set(activeItems.map((a) => a.sponsorFanHubUserId ?? sponsorName(a))).size;

  const stats: Stat[] = [
    { label: "Active Sponsorships", value: String(active?.pagination.total ?? 0), tint: "#3d6f3e", caption: "packages and physical assets" },
    { label: "Active Value", value: formatCents(activeValue), tint: "#3d5194", caption: "of the active ones" },
    { label: "Sponsors", value: String(sponsors), tint: "#5e4277", caption: "with an active sponsorship" },
    { label: "Physical Assets", value: String(activeItems.filter((a) => a.kind === "PHYSICAL_ASSET").length), tint: "#7a4a2e", caption: "active" },
  ];

  // Active ones by package (or physical asset) name.
  const slices: DonutSlice[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of activeItems) counts.set(a.packageName, (counts.get(a.packageName) ?? 0) + 1);
    return [...counts.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([label, count], i) => ({
        label,
        detail: String(count),
        percent: Math.round((count / activeItems.length) * 1000) / 10,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      }));
  }, [activeItems]);

  // Sponsors by active value, in dollars.
  const topSponsors = useMemo(() => {
    const byName = new Map<string, number>();
    for (const a of activeItems) byName.set(sponsorName(a), (byName.get(sponsorName(a)) ?? 0) + a.totalCents);
    return [...byName.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([name, cents]) => ({ name, amount: cents / 100 }));
  }, [activeItems]);

  return (
    <div className="flex flex-col gap-10">
      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Sponsors
          </h2>
          <p className="text-base leading-[26px]">Who sponsors you, and the packages they can buy.</p>
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
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_348px] gap-10 items-start">
        {/* Sponsorships list */}
        <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06 min-w-0">
          <Tabs
            tabs={TABS}
            active={tab}
            onChange={(t) => {
              setTab(t);
              setPage(1);
            }}
          />

          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search sponsors" />

          <div className="flex flex-col">
            <GenericTable
              columns={columns}
              rows={rows}
              getKey={(a) => a.id}
              loading={loading}
              empty={list?.error ?? (q ? "No sponsors match your search." : "No sponsorships yet.")}
              headerCellClassName="bg-white/[0.08]"
              cellClassName="bg-white/[0.04] py-4"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${total} sponsorships`}</span>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-10 items-start">
          <DonutBreakdown
            title="Sponsorship Breakdown"
            centerValue={String(activeItems.length)}
            centerLabel="Active"
            slices={slices}
            emptyText="No active sponsorships yet."
          />
          <RankedList title="Top Sponsors by Value" items={topSponsors} onViewAll={() => setTab("Active")} />
        </div>
      </div>

      <PackagesPreview />
    </div>
  );
}
