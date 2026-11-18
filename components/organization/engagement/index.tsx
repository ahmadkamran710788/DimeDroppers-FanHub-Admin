"use client";

import { useState } from "react";
import Tabs from "@/components/common/tabs";
import ChallengesTab from "@/components/organization/engagement/challenges-tab";
import { ARCADE_GAMES, ARCADE_STATS, QUEST_STATS, QUESTS } from "@/components/organization/engagement/data";
import OverviewTab from "@/components/organization/engagement/overview-tab";
import GameCampaignTab from "@/components/organization/engagement/game-campaign-tab";
import SettingsTable from "@/components/organization/engagement/settings-table";
import TabBody from "@/components/organization/engagement/tab-body";

const ALL_TABS = ["Overview", "Predictions", "Voting", "Challenges", "Quests", "Arcade", "Settings"] as const;
type Tab = (typeof ALL_TABS)[number];
// Hidden for now; take a tab out of this list to show it again.
const HIDDEN_TABS: readonly Tab[] = ["Arcade", "Settings"];
const TABS = ALL_TABS.filter((t) => !HIDDEN_TABS.includes(t));

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
        <GameCampaignTab key="predictions" tab="predictions" />
      ) : tab === "Voting" ? (
        <GameCampaignTab key="voting" tab="voting" />
      ) : tab === "Challenges" ? (
        <ChallengesTab />
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
