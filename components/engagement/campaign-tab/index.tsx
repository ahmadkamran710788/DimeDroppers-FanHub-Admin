"use client";

import { campaignRow, saveCampaign, tabStats, type EngagementTab } from "@/components/engagement/engagement-rows";
import SettingsTable from "@/components/engagement/settings-table";
import TabBody from "@/components/engagement/tab-body";
import { useEngagementCampaigns } from "@/components/engagement/use-engagement-campaigns";

const TITLE: Record<EngagementTab, string> = {
  predictions: "Available Predictions",
  voting: "Available Voting",
  challenges: "Available Challenges",
};

// Predictions, Voting or Challenges: the tab's cards and the school's campaigns of that type,
// each with its own status, multiplier, threshold and visibility switches.
export default function CampaignTab({ tab }: { tab: EngagementTab }) {
  const { stats, campaigns, loading } = useEngagementCampaigns(tab);

  return (
    <TabBody stats={tabStats(tab, stats)} title={TITLE[tab]}>
      <SettingsTable
        // Re-seed the table once the rows arrive.
        key={loading ? `${tab}-loading` : tab}
        rows={campaigns.map((c) => campaignRow(tab, c))}
        loading={loading}
        liveLabel="Activated"
        onSave={(row, patch) => saveCampaign(tab, row, patch)}
      />
    </TabBody>
  );
}
