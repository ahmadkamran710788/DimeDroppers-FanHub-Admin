"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Tabs from "@/components/common/tabs";
import GivingOverview from "@/components/fundraising/giving-overview";
import StatCard from "@/components/fundraising/stat-card";
import TopDonors from "@/components/fundraising/top-donors";
import TeamsTable from "@/components/teams/teams-table";
import {
  SAMPLE_CAMPAIGNS,
  SAMPLE_GIVING,
  SAMPLE_GIVING_TOTAL,
  SAMPLE_STATS,
  SAMPLE_TOP_DONORS,
} from "@/components/fundraising/data";
import { routes } from "@/utils/routes";

const TABS = ["Teams", "Donations", "Donors", "Fundraisers", "Payouts"] as const;
type Tab = (typeof TABS)[number];

// Only the Teams tab is built; the rest land with their own designs.
const comingSoon = () => toast("Coming soon.");

// Campaign names grouped by team, for the Teams tab's Campaigns dropdown.
const CAMPAIGNS_BY_TEAM = SAMPLE_CAMPAIGNS.reduce<Record<string, string[]>>((acc, c) => {
  (acc[c.teamId] ??= []).push(c.title);
  return acc;
}, {});

export default function FundraisingPage() {
  const router = useRouter();
  const openCreate = () => router.push(routes.ui.createFundraisingCampaign);
  const [tab, setTab] = useState<Tab>("Teams");

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-10 items-start">
        <GivingOverview total={SAMPLE_GIVING_TOTAL} slices={SAMPLE_GIVING} onViewReports={comingSoon} />
        <TopDonors donors={SAMPLE_TOP_DONORS} onViewAll={comingSoon} />
      </div>

      {/* Tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Teams" ? (
          <TeamsTable campaignsByTeam={CAMPAIGNS_BY_TEAM} />
        ) : (
          <p className="py-12 text-center text-sm text-white/40">{tab} are coming soon.</p>
        )}
      </div>
    </div>
  );
}
