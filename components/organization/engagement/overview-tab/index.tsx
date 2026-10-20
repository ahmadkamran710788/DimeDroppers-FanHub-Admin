"use client";

import type { ReactNode } from "react";
import { Dices, Gamepad2, ListChecks, SquareCheckBig, Trophy } from "lucide-react";
import { SAMPLE_CAMPAIGN_TYPES, type CampaignTypeId } from "@/components/organization/engagement/data";
import { overviewStats, saveType, TYPE_ID, typeRow } from "@/components/organization/engagement/engagement-rows";
import SettingsTable from "@/components/organization/engagement/settings-table";
import TabBody from "@/components/organization/engagement/tab-body";
import { useEngagementOverview } from "@/components/organization/engagement/use-engagement-overview";

const CAMPAIGN_ICON: Record<CampaignTypeId, ReactNode> = {
  predictions: <Dices className="size-5" strokeWidth={1.75} />,
  voting: <SquareCheckBig className="size-5" strokeWidth={1.75} />,
  challenges: <ListChecks className="size-5" strokeWidth={1.75} />,
  quests: <Trophy className="size-5" strokeWidth={1.75} />,
  arcade: <Gamepad2 className="size-5" strokeWidth={1.75} />,
};


// Overview: the five cards and the Campaign Types rows. Predictions, Voting and Challenges save
// to the API; Quests and Arcade are still sample rows (no endpoint yet).
export default function OverviewTab() {
  const { overview, loading } = useEngagementOverview();
  const apiRows = overview?.types.map(typeRow) ?? [];
  const sampleIds = new Set(SAMPLE_CAMPAIGN_TYPES.map((t) => t.id as string));

  return (
    <TabBody stats={overviewStats(overview)} title="Campaign Types">
      <SettingsTable
        // Re-seed the table once the rows arrive.
        key={loading ? "loading" : "overview"}
        rows={loading ? [] : [...apiRows, ...SAMPLE_CAMPAIGN_TYPES]}
        loading={loading}
        icon={(row) => CAMPAIGN_ICON[TYPE_ID[row.id as keyof typeof TYPE_ID] ?? (row.id as CampaignTypeId)]}
        onSave={(row, patch) => (sampleIds.has(row.id) ? Promise.resolve(true) : saveType(row, patch))}
      />
    </TabBody>
  );
}
