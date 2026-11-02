"use client";

import { useState } from "react";
import Tabs from "@/components/common/tabs";
import CampaignPlanner from "@/components/sponsor/campaign-planner";
import FindOrganizations from "@/components/sponsor/find-organizations";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";

export type SponsorshipTab = "planner" | "find";

// Both tabs are the Campaign Planner; the badge tells national from local apart.
const TAB_LABELS: Record<SponsorshipTab, string> = {
  planner: "Campaign Planner",
  find: "Campaign Planner",
};

const TAB_BADGES: Record<SponsorshipTab, string> = {
  planner: "NATIONAL",
  find: "LOCAL",
};

// Campaign Planner is for national accounts only, and opens first for them.
const TABS: SponsorshipTab[] = SPONSOR_PROFILE.nationalAccount ? ["planner", "find"] : ["find"];

interface SponsorshipsProps {
  // From ?tab=; ignored when the account doesn't have that tab.
  initialTab?: SponsorshipTab;
}

// The Sponsorships page: Dime AI's Campaign Planner (national) and Find Organizations (local) as tabs. A
// tab's panel is mounted the first time it opens and then only hidden, so a search or a trimmed plan
// survives switching back and forth.
export default function Sponsorships({ initialTab }: SponsorshipsProps) {
  const start = initialTab && TABS.includes(initialTab) ? initialTab : TABS[0];
  const [tab, setTab] = useState<SponsorshipTab>(start);
  const [opened, setOpened] = useState<ReadonlySet<SponsorshipTab>>(new Set([start]));

  function open(next: SponsorshipTab) {
    setTab(next);
    setOpened((prev) => new Set(prev).add(next));
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <Tabs tabs={TABS} active={tab} onChange={open} labels={TAB_LABELS} badges={TAB_BADGES} className="flex-wrap" />
      {TABS.map((t) =>
        opened.has(t) ? (
          <div key={t} role="tabpanel" aria-label={`${TAB_LABELS[t]} (${TAB_BADGES[t].toLowerCase()})`} hidden={t !== tab}>
            {t === "planner" ? <CampaignPlanner /> : <FindOrganizations />}
          </div>
        ) : null
      )}
    </div>
  );
}
