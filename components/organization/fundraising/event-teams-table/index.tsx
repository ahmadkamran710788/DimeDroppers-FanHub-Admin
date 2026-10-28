"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import FilterDropdown from "@/components/common/filter-dropdown";
import GenericTable, { type Column } from "@/components/common/generic-table";
import CampaignsTable from "@/components/organization/fundraising/campaigns-table";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import Toggle from "@/components/common/toggle";
import { useEventTeams } from "@/components/organization/fundraising/use-event-teams";
import { backendFetch } from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { CampaignStatus, TournamentTeamDonations, TournamentTeamDonationsResponse } from "@/utils/types/campaign";

const SEARCH_DELAY_MS = 300;
type StatusFilter = "" | Exclude<CampaignStatus, never>;
const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Ended", value: "ENDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// The Teams tab of a tournament's Fundraising: every team of the event with its campaigns and what
// they raised (GET /campaigns/tournament/events/{id}/team-donations). Searched, by division, by
// campaign status and "only teams with campaigns" on the server. A row opens to its campaigns; a team
// without one offers "Create donation", which opens the form with the team chosen.
export default function EventTeamsTable({ eventId }: { eventId: string }) {
  const router = useRouter();
  // The division list (the picker's teams endpoint lists every team, unfiltered).
  const { teams: allTeams } = useEventTeams(eventId);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [onlyWithCampaigns, setOnlyWithCampaigns] = useState(false);
  // The team whose campaigns are open (one at a time, as on a school's Teams tab).
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Bumped after a campaign action (launch, end, cancel), so the totals refetch.
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; view?: TournamentTeamDonationsResponse; error?: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [query]);

  const params = new URLSearchParams({
    ...(search && { search }),
    ...(divisionId && { divisionId }),
    ...(status && { status }),
    // `status` filters each team's campaigns; with hasCampaigns the list keeps only the teams that have
    // one in that status, which is what picking a status means here.
    ...((onlyWithCampaigns || status) && { hasCampaigns: "true" }),
  }).toString();
  const key = eventId ? `${eventId}?${params}|${reloads}` : "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    // Not cached: totals change as campaigns are created and donations come in.
    backendFetch(`${routes.api.tournamentTeamDonations(eventId)}${params ? `?${params}` : ""}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        setLoaded(
          res.ok
            ? { key, view: json?.data?.[0] as TournamentTeamDonationsResponse }
            : { key, error: json?.message || "Couldn't load the teams." }
        );
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, error: "Please check your network and try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [key, eventId, params]);

  const current = loaded?.key === key ? loaded : null;
  const rows = current?.view?.items ?? [];
  const divisions = useMemo(
    () => [...new Map(allTeams.filter((t) => t.division).map((t) => [t.division!.id, t.division!.name ?? "Division"])).entries()],
    [allTeams]
  );

  const createFor = (teamId: string) => router.push(`${routes.ui.createFundraisingCampaign}?team=${teamId}`);

  const columns: Column<TournamentTeamDonations>[] = [
    {
      header: "Team",
      cls: "flex-1 min-w-[180px] py-4",
      cell: (t) => (
        <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
          <span className="font-semibold">{t.name}</span>
          {(t.pool || t.grade) && (
            <span className="opacity-50">{[t.pool && `Pool ${t.pool}`, t.grade && `Grade ${t.grade}`].filter(Boolean).join(" · ")}</span>
          )}
        </div>
      ),
    },
    { header: "Division", cls: "w-[160px] shrink-0 py-4", cell: (t) => t.division?.name ?? "—" },
    {
      // As on a school's Teams tab: Status, then Campaigns on its own.
      header: "Status",
      cls: "w-[100px] shrink-0 py-4",
      // Active while the team has an ACTIVE campaign.
      cell: (t) =>
        t.activeCampaignCount > 0 ? (
          <StatusPill label="Active" color="bg-success" className="px-2" textClassName="text-white" />
        ) : (
          <StatusPill label="Inactive" color="bg-white/15" className="px-2" textClassName="text-white/80" />
        ),
    },
    {
      header: "Campaigns",
      cls: "w-[130px] shrink-0 py-4",
      cell: (t) =>
        t.campaignCount === 0 ? (
          <span className="text-white/40">No campaigns</span>
        ) : (
          <span className="flex items-center gap-1 whitespace-nowrap">
            {t.campaignCount} {t.campaignCount === 1 ? "Campaign" : "Campaigns"}
            <ChevronDown className={cn("w-4 h-4 transition-transform", expandedId === t.id && "rotate-180")} />
          </span>
        ),
    },
    {
      header: "Raised",
      cls: "w-[140px] shrink-0 py-4",
      cell: (t) => (
        <div className="flex flex-col leading-4">
          <span>{formatMoney(t.totalRaised)}</span>
          {t.goalAmount > 0 && <span className="opacity-50">{`of ${formatMoney(t.goalAmount)}`}</span>}
        </div>
      ),
    },
    { header: "Donations", cls: "w-[90px] shrink-0 py-4", cell: (t) => String(t.donationCount) },
    {
      header: "",
      cls: "w-[150px] shrink-0 py-3 justify-end",
      cell: (t) => (
        // The row click opens the campaigns; the wrapper keeps this click from reaching it.
        <span onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            label="Create donation"
            onClick={() => createFor(t.id)}
            className="border border-white/15 bg-white/[0.06]"
          />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          variant="dark"
          placeholder="Search teams..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search teams"
          className="w-full sm:w-72"
        />
        {divisions.length > 0 && (
          <FilterDropdown
            label="All divisions"
            options={[{ label: "All divisions", value: "" }, ...divisions.map(([value, label]) => ({ label, value }))]}
            value={divisionId}
            onChange={setDivisionId}
          />
        )}
        <Toggle
          size="sm"
          label="Only teams with campaigns"
          labelPosition="right"
          checked={onlyWithCampaigns}
          onChange={setOnlyWithCampaigns}
        />
      </div>
      <FilterChips ariaLabel="Campaign status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />

      {current?.error ? (
        <p className="py-12 text-center text-sm text-error">{current.error}</p>
      ) : (
        <GenericTable
          columns={columns}
          rows={rows}
          getKey={(t) => t.id}
          loading={!current}
          empty={
            onlyWithCampaigns || status ? "No teams have campaigns that match." : search || divisionId ? "No teams match these filters." : "This event has no teams yet."
          }
          headerCellClassName="bg-white/[0.08]"
          cellClassName="bg-white/[0.04]"
          // As on a school's Teams tab: a team with campaigns opens to their table (one at a time).
          onRowClick={(t) => t.campaigns.length > 0 && setExpandedId((id) => (id === t.id ? null : t.id))}
          renderExpanded={(t) =>
            expandedId === t.id && t.campaigns.length > 0 ? (
              <div className="p-4 bg-black/30 border-b border-white/20">
                <CampaignsTable campaigns={t.campaigns} onChanged={() => setReloads((n) => n + 1)} />
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}
