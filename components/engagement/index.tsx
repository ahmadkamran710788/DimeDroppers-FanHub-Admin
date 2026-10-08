"use client";

import { useState, type ReactNode } from "react";
import { Dices, Gamepad2, ListChecks, SquareCheckBig, Trophy } from "lucide-react";
import StatCard, { type Stat } from "@/components/common/stat-card";
import Tabs from "@/components/common/tabs";
import {
  ENGAGEMENT_CAMPAIGN_TYPES,
  ENGAGEMENT_STATS,
  PREDICTION_STATS,
  PREDICTIONS,
  POLLS,
  VOTING_STATS,
  CHALLENGES,
  CHALLENGE_STATS,
  QUESTS,
  QUEST_STATS,
  ARCADE_GAMES,
  ARCADE_STATS,
  type CampaignTypeId,
} from "@/components/engagement/data";
import SettingsTable from "@/components/engagement/settings-table";

const TABS = ["Overview", "Predictions", "Voting", "Challenges", "Quests", "Arcade", "Settings"] as const;
type Tab = (typeof TABS)[number];

const CAMPAIGN_ICON: Record<CampaignTypeId, ReactNode> = {
  predictions: <Dices className="size-5" strokeWidth={1.75} />,
  voting: <SquareCheckBig className="size-5" strokeWidth={1.75} />,
  challenges: <ListChecks className="size-5" strokeWidth={1.75} />,
  quests: <Trophy className="size-5" strokeWidth={1.75} />,
  arcade: <Gamepad2 className="size-5" strokeWidth={1.75} />,
};

// Stat cards above a titled settings table — the layout every built tab shares.
function TabBody({ stats, title, children }: { stats: Stat[]; title: string; children: ReactNode }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} twoLineTitle />
        ))}
      </div>

      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">{title}</h3>
        {children}
      </div>
    </>
  );
}

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
        <TabBody stats={ENGAGEMENT_STATS} title="Campaign Types">
          <SettingsTable key="overview" rows={ENGAGEMENT_CAMPAIGN_TYPES} icon={(row) => CAMPAIGN_ICON[row.id as CampaignTypeId]} />
        </TabBody>
      ) : tab === "Predictions" ? (
        <TabBody stats={PREDICTION_STATS} title="Available Predictions">
          <SettingsTable key="predictions" rows={PREDICTIONS} liveLabel="Activated" />
        </TabBody>
      ) : tab === "Voting" ? (
        <TabBody stats={VOTING_STATS} title="Available Voting">
          <SettingsTable key="voting" rows={POLLS} liveLabel="Activated" />
        </TabBody>
      ) : tab === "Challenges" ? (
        <TabBody stats={CHALLENGE_STATS} title="Available Challenges">
          <SettingsTable key="challenges" rows={CHALLENGES} liveLabel="Activated" />
        </TabBody>
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
