"use client";

import { useState } from "react";
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
// each with its own status, multiplier, threshold and visibility switches. The API pages the rows.
export default function CampaignTab({ tab }: { tab: EngagementTab }) {
  const [page, setPage] = useState(1);
  const { stats, campaigns, total, loading, version, reload } = useEngagementCampaigns(tab, page);

  return (
    <TabBody stats={tabStats(tab, stats)} title={TITLE[tab]}>
      <SettingsTable
        // Re-seed the table's rows whenever a page (or a refetch of it) arrives.
        key={loading ? `${tab}-loading` : `${tab}-${page}-${version}`}
        rows={campaigns.map((c) => campaignRow(tab, c))}
        loading={loading}
        liveLabel="Activated"
        onSave={async (row, patch) => {
          const saved = await saveCampaign(tab, row, patch);
          // The PATCH reply has no displayStatus, so a status change refetches the page for the new badge.
          if (saved && patch.active !== undefined) reload();
          return saved;
        }}
        serverPagination={{ page, total, onChange: setPage }}
      />
    </TabBody>
  );
}
