"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import type { Stat } from "@/components/common/stat-card";
import Tabs from "@/components/common/tabs";
import EventSelect from "@/components/organization/event-select";
import AllCampaigns from "@/components/organization/fundraising/all-campaigns";
import EventTeamsTable from "@/components/organization/fundraising/event-teams-table";
import StatCard from "@/components/organization/fundraising/stat-card";
import { useSelectedEvent } from "@/context/selected-event";
import { backendFetch } from "@/utils/api-call";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { Campaign, CampaignListPage, EventDonationItem, OrgEventDonations } from "@/utils/types/campaign";

const TABS = ["Teams", "Donations", "Fundraisers"] as const;
type Tab = (typeof TABS)[number];
const DONATIONS_PAGE_SIZE = 20;
// Every campaign of the event is listed at once (the API caps a page at 100).
const CAMPAIGNS_LIMIT = 100;

// GETs without apiCall's cache: the report changes as campaigns are created and donations come in.
async function getView<T>(endpoint: string): Promise<{ view?: T; message?: string }> {
  try {
    const res = await backendFetch(endpoint, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    return res.ok ? { view: json?.data?.[0] as T } : { message: json?.message || "Something went wrong, please try again." };
  } catch {
    return { message: "Please check your network and try again." };
  }
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

// The event's totals (paid donations, every campaign status).
const statCards = (s: OrgEventDonations["summary"] | null): Stat[] => [
  {
    label: "Total Raised",
    value: s ? formatMoney(s.totalRaised) : "—",
    tint: "rgba(101,193,98,0.5)",
    caption: s ? `${formatMoney(s.totalNet)} after fees` : "",
  },
  {
    label: "Total Donations",
    value: s ? s.donationCount.toLocaleString("en-US") : "—",
    tint: "rgba(99,139,254,0.5)",
    caption: s ? `${s.donorCount.toLocaleString("en-US")} donors` : "",
  },
  {
    label: "Campaigns",
    value: s ? String(s.campaigns) : "—",
    tint: "rgba(157,98,193,0.5)",
    caption: s ? `Goal ${formatMoney(s.goalAmount)}` : "",
  },
  {
    label: "Teams Raising",
    value: s ? String(s.teamsWithCampaigns) : "—",
    tint: "rgba(184,184,184,0.5)",
    caption: "with a campaign",
  },
];

const donationColumns: Column<EventDonationItem>[] = [
  {
    header: "Donor",
    cls: "flex-1 min-w-[160px] py-4",
    cell: (d) => (
      <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
        <span className="font-semibold">{d.donor}</span>
        {d.message && <span className="opacity-60 line-clamp-2">{`“${d.message}”`}</span>}
      </div>
    ),
  },
  {
    header: "Campaign",
    cls: "w-[200px] shrink-0 py-4",
    cell: (d) => (
      <div className="flex flex-col gap-1 min-w-0 text-xs">
        <span className="break-words">{d.campaign?.title ?? "—"}</span>
        {d.campaign?.tournamentTeam && <span className="opacity-50">{d.campaign.tournamentTeam.name}</span>}
      </div>
    ),
  },
  { header: "Side", cls: "w-[70px] shrink-0 py-4", cell: (d) => (d.side === "AWAY" ? "Away" : "Home") },
  { header: "Amount", cls: "w-[90px] shrink-0 py-4", cell: (d) => formatMoney(d.amount) },
  { header: "Net", cls: "w-[90px] shrink-0 py-4", cell: (d) => formatMoney(d.netAmount) },
  { header: "Date", cls: "w-[110px] shrink-0 py-4", cell: (d) => fmtDate(d.createdAt) ?? "—" },
];

// Fundraising for a tournament: one event at a time (the event shared with the other pages). Its
// donations report (GET /donations/events/{id}) gives the cards, each team's totals and the paid
// donations; its campaigns (GET /campaigns?eventId=) fill Fundraisers. A campaign is for one team.
export default function TournamentFundraising() {
  const router = useRouter();
  const { event, setEvent, noEvents } = useSelectedEvent();
  const eventId = event?.id ?? "";
  const [tab, setTab] = useState<Tab>("Teams");
  const [page, setPage] = useState(1);
  // Bumped after a campaign changes, so the report and the list refetch.
  const [reloads, setReloads] = useState(0);
  const [report, setReport] = useState<{ key: string; view?: OrgEventDonations; error?: string } | null>(null);
  const [campaigns, setCampaigns] = useState<{ key: string; items: Campaign[] } | null>(null);

  // A new event starts its donations on page 1.
  const [pageEvent, setPageEvent] = useState(eventId);
  if (pageEvent !== eventId) {
    setPageEvent(eventId);
    setPage(1);
  }

  const reportKey = eventId ? `${eventId}|${page}|${reloads}` : "";
  useEffect(() => {
    if (!reportKey) return;
    let cancelled = false;
    getView<OrgEventDonations>(`${routes.api.eventDonations(eventId)}?page=${page}&limit=${DONATIONS_PAGE_SIZE}`).then((r) => {
      if (!cancelled) setReport({ key: reportKey, view: r.view, error: r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [reportKey, eventId, page]);

  const campaignsKey = eventId ? `${eventId}|${reloads}` : "";
  useEffect(() => {
    if (!campaignsKey) return;
    let cancelled = false;
    getView<CampaignListPage>(`${routes.api.campaigns}?eventId=${eventId}&page=1&limit=${CAMPAIGNS_LIMIT}`).then((r) => {
      if (!cancelled) setCampaigns({ key: campaignsKey, items: r.view?.items ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, [campaignsKey, eventId]);

  const current = report?.key === reportKey ? report : null;
  const view = current?.view ?? null;
  const campaignList = campaigns?.key === campaignsKey ? campaigns.items : null;
  const pagination = view?.donations.pagination;

  return (
    <div className="flex flex-col gap-10">
      {/* Title, event, create */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Fundraising
          </h2>
          <p className="text-base leading-[26px]">Raise money for your events&apos; teams and track every donation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <EventSelect
            value={eventId}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
          <Button
            variant="cta"
            label="Create Campaign"
            className="shrink-0 whitespace-nowrap"
            onClick={() => router.push(routes.ui.createFundraisingCampaign)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {statCards(view?.summary ?? null).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
          counts={{ Donations: pagination?.total ?? 0, Fundraisers: campaignList?.length ?? 0 }}
        />

        {noEvents && !eventId ? (
          <p className="py-12 text-center text-sm text-white/60">Pick an event to see its fundraising.</p>
        ) : !eventId || (!current && tab !== "Fundraisers") ? (
          <Loader />
        ) : current?.error && tab !== "Fundraisers" ? (
          <p className="py-12 text-center text-sm text-error">{current.error}</p>
        ) : tab === "Teams" ? (
          <EventTeamsTable eventId={eventId} />
        ) : tab === "Donations" ? (
          <div className="flex flex-col">
            <GenericTable
              columns={donationColumns}
              rows={view?.donations.items ?? []}
              getKey={(d) => d.id}
              empty="No donations for this event yet."
              headerCellClassName="bg-white/[0.08]"
              cellClassName="bg-white/[0.04]"
            />
            {pagination && pagination.total > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <span className="text-xs text-white/80">
                  {`Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )} of ${pagination.total} donations`}
                </span>
                <Pagination page={pagination.page} pageCount={pagination.totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        ) : (
          <AllCampaigns campaigns={campaignList ?? []} loading={campaignList === null} onChanged={() => setReloads((n) => n + 1)} />
        )}
      </div>
    </div>
  );
}
