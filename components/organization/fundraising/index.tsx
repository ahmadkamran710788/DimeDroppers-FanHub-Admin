"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button";
import type { Stat } from "@/components/common/stat-card";
import Tabs from "@/components/common/tabs";
import AllCampaigns from "@/components/organization/fundraising/all-campaigns";
import GivingOverview from "@/components/organization/fundraising/giving-overview";
import StatCard from "@/components/organization/fundraising/stat-card";
import { useCampaigns } from "@/components/organization/fundraising/use-campaigns";
import { useDonationsByTeam } from "@/components/organization/fundraising/use-donations-by-team";
import TeamsTable from "@/components/organization/teams/teams-table";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import Loader from "@/components/common/loader";
import TournamentFundraising from "@/components/organization/fundraising/tournament-fundraising";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSetup } from "@/context/setup";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { Campaign, CampaignStats } from "@/utils/types/campaign";

const TABS = ["Teams", "Donations", "Donors", "Fundraisers", "Payouts"] as const;
type Tab = (typeof TABS)[number];

// The four stat cards, from GET /fanhub/org/campaigns/stats.
const statCards = (s: CampaignStats | null): Stat[] => [
  {
    label: "Total Raised",
    value: s ? formatMoney(s.totalRaised) : "—",
    tint: "rgba(101,193,98,0.5)",
    caption: s ? `${formatMoney(s.last30Days.raised)} in the last 30 days` : "",
  },
  {
    label: "Total Donations",
    value: s ? s.totalDonations.toLocaleString("en-US") : "—",
    tint: "rgba(99,139,254,0.5)",
    caption: s ? `${s.last30Days.donations.toLocaleString("en-US")} in the last 30 days` : "",
  },
  {
    label: "Active Campaigns",
    value: s ? String(s.campaigns.active) : "—",
    tint: "rgba(157,98,193,0.5)",
    caption: s ? `${s.activeCampaigns.progressPercent}% of ${formatMoney(s.activeCampaigns.goalTotal)} raised` : "",
  },
  {
    label: "Donors",
    value: s ? s.donors.toLocaleString("en-US") : "—",
    tint: "rgba(184,184,184,0.5)",
    caption: s ? `Average donation ${formatMoney(s.averageDonation)}` : "",
  },
];

// Tournaments raise per game of an event (their own page); schools per team. Nothing loads until the
// organisation type is known, so a tournament never calls the school endpoints.
export default function FundraisingPage() {
  const { org, isLoading } = useAuth();
  const kind = orgKindOf(org);
  if (kind === null) {
    // The profile didn't load (e.g. a network blip on /me): say so instead of spinning for ever.
    if (!isLoading && !org) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-white">
          <p className="text-sm text-white/70">We couldn&apos;t load your organization.</p>
          <Button label="Try again" onClick={() => window.location.reload()} />
        </div>
      );
    }
    return <Loader />;
  }
  return kind === "tournament" ? <TournamentFundraising /> : <SchoolFundraising />;
}

function SchoolFundraising() {
  const router = useRouter();
  const openCreate = () => router.push(routes.ui.createFundraisingCampaign);
  const [tab, setTab] = useState<Tab>("Teams");
  const { teams, loading: teamsLoading } = useOrgTeams();
  const { campaigns, stats, loading, reload } = useCampaigns();
  const { teams: teamDonations, loading: donationsLoading } = useDonationsByTeam();
  const { savedSchool } = useSetup();
  const { org } = useAuth();
  const orgName = savedSchool?.name ?? org?.name;

  // Campaigns grouped by team, shown under a team when it is clicked in the Teams tab.
  const campaignsByTeam = useMemo(
    () =>
      campaigns.reduce<Record<string, Campaign[]>>((acc, c) => {
        // A tournament campaign has no school team.
        if (c.teamId) (acc[c.teamId] ??= []).push(c);
        return acc;
      }, {}),
    [campaigns]
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Title + create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Fundraising
          </h2>
          <p className="text-base leading-[26px]">
            {`Manage fundraising campaigns, track donations, and engage your community${orgName ? ` supporting ${orgName}` : ""}`}
          </p>
        </div>
        <Button variant="cta" label="Create Campaign" className="shrink-0 whitespace-nowrap" onClick={openCreate} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {statCards(stats).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* How the money raised splits across the teams (paid donations). */}
      <GivingOverview teams={teamDonations} loading={donationsLoading} />

      {/* Tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Fundraisers: campaigns.length }} />

        {tab === "Teams" ? (
          <TeamsTable
            teams={teams}
            loading={teamsLoading || loading}
            campaignsByTeam={campaignsByTeam}
            onCampaignsChanged={reload}
          />
        ) : tab === "Fundraisers" ? (
          <AllCampaigns campaigns={campaigns} loading={loading} onChanged={reload} />
        ) : (
          <p className="py-12 text-center text-sm text-white/40">{tab} are coming soon.</p>
        )}
      </div>
    </div>
  );
}
