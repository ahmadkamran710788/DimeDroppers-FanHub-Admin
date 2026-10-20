"use client";

import { useState } from "react";
import Tabs from "@/components/common/tabs";
import CampaignTab from "@/components/organization/engagement/campaign-tab";
import { ARCADE_GAMES, ARCADE_STATS, QUEST_STATS, QUESTS } from "@/components/organization/engagement/data";
import OverviewTab from "@/components/organization/engagement/overview-tab";
import SettingsTable from "@/components/organization/engagement/settings-table";
import TabBody from "@/components/organization/engagement/tab-body";

const TABS = ["Overview", "Predictions", "Voting", "Challenges", "Quests", "Arcade", "Settings"] as const;
type Tab = (typeof TABS)[number];

// Overview, Predictions, Voting and Challenges come from the engagement API; Quests and Arcade
// are still sample data (no endpoint yet).
export default function EngagementPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Engagement Campaigns
        </h2>
        <p className="text-base leading-[26px]">
          Manage and configure engagement campaigns to boost fan participation and reward activity.
        </p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" ? (
        <OverviewTab />
      ) : tab === "Predictions" ? (
        <CampaignTab key="predictions" tab="predictions" />
      ) : tab === "Voting" ? (
        <CampaignTab key="voting" tab="voting" />
      ) : tab === "Challenges" ? (
        <CampaignTab key="challenges" tab="challenges" />
      ) : tab === "Quests" ? (
        <TabBody stats={QUEST_STATS} title="Available Quests">
          <SettingsTable key="quests" rows={QUESTS} liveLabel="Activated" />
        </TabBody>
      ) : tab === "Arcade" ? (
        <TabBody stats={ARCADE_STATS} title="Available Arcade">
          <SettingsTable key="arcade" rows={ARCADE_GAMES} liveLabel="Activated" />
        </TabBody>
      ) : (
        <p className="py-12 text-center text-sm text-white/40">{tab} is coming soon.</p>
      )}
    </div>
  );
}
