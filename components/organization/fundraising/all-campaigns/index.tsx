"use client";

import { useMemo, useState } from "react";
import FilterChips, { type FilterChipOption } from "@/components/common/filter-chips";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import { campaignStatusLabel, type CampaignStatusLabel } from "@/components/organization/fundraising/campaign-status";
import CampaignsTable from "@/components/organization/fundraising/campaigns-table";
import type { Campaign } from "@/utils/types/campaign";

const PAGE_SIZE = 10;

type StatusFilter = "" | CampaignStatusLabel;

interface AllCampaignsProps {
  campaigns: Campaign[];
  loading: boolean;
  onChanged: () => void;
}

// The Fundraisers tab: every campaign of the organisation, filtered by status and searched by
// title, description, team or sponsor.
export default function AllCampaigns({ campaigns, loading, onChanged }: AllCampaignsProps) {
  const [status, setStatus] = useState<StatusFilter>("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const byStatus: Record<CampaignStatusLabel, number> = { Active: 0, Draft: 0, Ended: 0, Cancelled: 0 };
    campaigns.forEach((c) => byStatus[campaignStatusLabel(c)]++);
    return byStatus;
  }, [campaigns]);

  const options: FilterChipOption<StatusFilter>[] = [
    { value: "", label: `All (${campaigns.length})` },
    ...(["Active", "Draft", "Ended", "Cancelled"] as const).map((s) => ({ value: s, label: `${s} (${counts[s]})` })),
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter(
      (c) =>
        (!status || campaignStatusLabel(c) === status) &&
        (!q ||
          [c.title, c.description, c.team?.name ?? c.tournamentTeam?.name, c.sponsorName].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [campaigns, status, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <SearchInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search campaigns"
          aria-label="Search campaigns"
          className="lg:max-w-sm"
        />
        <FilterChips
          options={options}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </div>
      <div className="flex flex-col">
        <CampaignsTable
          campaigns={rows}
          loading={loading}
          onChanged={onChanged}
          showTeam
          empty={campaigns.length === 0 ? "No campaigns yet." : "No campaigns match your filters."}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
          <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${filtered.length} campaigns`}</span>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
