"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus, Filter, MailPlus, Share, Users } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import GivingOverview from "@/components/fundraising/GivingOverview";
import { HelpCard, QuickLinks, TopDonors, type QuickLink } from "@/components/fundraising/SidePanels";
import StatCard from "@/components/fundraising/StatCard";
import {
  CAMPAIGN_STATUS_COLOR,
  CAMPAIGN_TYPE_COLOR,
  SAMPLE_CAMPAIGNS,
  SAMPLE_GIVING,
  SAMPLE_GIVING_TOTAL,
  SAMPLE_STATS,
  SAMPLE_TOP_DONORS,
  type FundraisingCampaign,
} from "@/components/fundraising/data";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";

const PAGE_SIZE = 8;
const TABS = ["Campaigns", "Donations", "Donors", "Fundraisers", "Payouts"] as const;
type Tab = (typeof TABS)[number];

// Only the Campaigns tab (8.1) is built; the rest land with their own designs.
const comingSoon = () => toast("Coming soon.");

const fmtEndDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const iconCls = "size-6";
const quickLinks = (onCreate: () => void): QuickLink[] => [
  { label: "Create Campaign", icon: <CirclePlus className={iconCls} strokeWidth={1.5} />, onSelect: onCreate },
  { label: "Invite Supporters", icon: <MailPlus className={iconCls} strokeWidth={1.5} />, onSelect: comingSoon },
  { label: "Share Donation Page", icon: <Share className={iconCls} strokeWidth={1.5} />, onSelect: comingSoon },
  { label: "Manage Fundraisers", icon: <Users className={iconCls} strokeWidth={1.5} />, onSelect: comingSoon },
];

const columns: Column<FundraisingCampaign>[] = [
  {
    header: "Campaign",
    cls: "flex-1 min-w-[320px]",
    cell: (c) => (
      <div className="flex items-start gap-2 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" className="size-28 shrink-0 rounded-[8px] object-cover" />
        <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
          <span className="font-semibold leading-[18px]">{c.title}</span>
          <span className="font-normal leading-[19px] opacity-40">{c.description}</span>
        </div>
      </div>
    ),
  },
  {
    header: "Type",
    cls: "w-[82px] shrink-0",
    cell: (c) => (
      <StatusPill
        label={c.type}
        color={CAMPAIGN_TYPE_COLOR[c.type]}
        className="px-2 backdrop-blur-[52px]"
        textClassName="text-white"
      />
    ),
  },
  { header: "Goal", cls: "w-[77px] shrink-0", cell: (c) => formatMoney(c.goal) },
  { header: "Raised", cls: "w-[77px] shrink-0", cell: (c) => formatMoney(c.raised) },
  {
    header: "Progress",
    cls: "w-[137px] shrink-0",
    cell: (c) => (
      <div
        role="progressbar"
        aria-valuenow={Math.round((c.raised / c.goal) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2 rounded-full bg-black/40"
      >
        <div className="h-2 rounded-[8px] bg-steel-blue" style={{ width: `${Math.min(100, (c.raised / c.goal) * 100)}%` }} />
      </div>
    ),
  },
  {
    header: "Status",
    cls: "w-[70px] shrink-0",
    cell: (c) => (
      <StatusPill
        label={c.status}
        color={CAMPAIGN_STATUS_COLOR[c.status]}
        className="px-2 backdrop-blur-[52px]"
        textClassName="text-midnight-navy"
      />
    ),
  },
  {
    header: "End Date",
    cls: "w-[126px] shrink-0 pl-[13px]",
    cell: (c) => (
      <div className="flex flex-col leading-5">
        <span>{fmtEndDate(c.endDate)}</span>
        <span>{`(${c.daysLeft} Days Left)`}</span>
      </div>
    ),
  },
  {
    header: "Actions",
    cls: "w-[73px] shrink-0 justify-center",
    cell: (c) => (
      <RowActionsMenu
        ariaLabel={`Actions for ${c.title}`}
        className="h-12 w-[50px] px-3 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 backdrop-blur-[24px]"
        items={[
          { label: "View Campaign", onSelect: comingSoon },
          { label: "Edit Campaign", onSelect: comingSoon },
          { label: "End Campaign", onSelect: comingSoon, variant: "destructive" },
        ]}
      />
    ),
  },
];

export default function FundraisingPage() {
  const router = useRouter();
  const openCreate = () => router.push(routes.ui.createFundraisingCampaign);
  const [tab, setTab] = useState<Tab>("Campaigns");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SAMPLE_CAMPAIGNS;
    return SAMPLE_CAMPAIGNS.filter((c) => [c.title, c.description, c.type].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-10">
      {/* Title + create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Fundraising
          </h2>
          <p className="text-base leading-[26px]">
            Manage fundraising campaigns, track donations, and engage your community supporting Twin Lakes Middle School
          </p>
        </div>
        <Button variant="cta" label="Create Campaign" className="shrink-0 whitespace-nowrap" onClick={openCreate} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {SAMPLE_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Overview panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-10 items-start">
        <GivingOverview total={SAMPLE_GIVING_TOTAL} slices={SAMPLE_GIVING} onViewReports={comingSoon} />
        <TopDonors donors={SAMPLE_TOP_DONORS} onViewAll={comingSoon} />
        <div className="flex flex-col gap-10">
          <QuickLinks links={quickLinks(openCreate)} />
          <HelpCard onLearnMore={comingSoon} />
        </div>
      </div>

      {/* Campaigns */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Campaigns" ? (
          <>
            <div className="flex items-center gap-6">
              <SearchInput
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                aria-label="Search campaigns"
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
                getKey={(c) => c.id}
                empty={query ? "No campaigns match your search." : "No fundraising campaigns yet."}
                headerCellClassName="bg-white/[0.08]"
                cellClassName="bg-white/[0.04] py-4"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <span className="text-xs text-white/80">
                  Showing {from} to {to} of {filtered.length} campaigns
                </span>
                <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
              </div>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-sm text-white/40">{tab} are coming soon.</p>
        )}
      </div>
    </div>
  );
}
