"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth";
import Loader from "@/components/common/loader";
import Tabs from "@/components/common/tabs";
import CampaignPlanner from "@/components/sponsor/campaign-planner";
import FindOrganizations from "@/components/sponsor/find-organizations";

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

interface SponsorshipsProps {
  // From ?tab=; ignored when the account doesn't have that tab.
  initialTab?: SponsorshipTab;
}

// The Sponsorships page: Dime AI's Campaign Planner (national) and Find Organizations (local) as tabs. The
// national planner is only for sponsors whose brand is a national brand (as the API allows), and opens first
// for them; it waits for the signed-in sponsor so the right tabs show from the start.
export default function Sponsorships({ initialTab }: SponsorshipsProps) {
  const { sponsor, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  const national = sponsor?.brand?.sponsorType === "NATIONAL_BRAND";
  // Keyed, so a brand type changed on the Sponsor Profile starts the tabs afresh.
  return (
    <SponsorshipTabs
      key={national ? "national" : "local"}
      tabs={national ? ["planner", "find"] : ["find"]}
      initialTab={initialTab}
    />
  );
}

interface SponsorshipTabsProps {
  tabs: SponsorshipTab[];
  initialTab?: SponsorshipTab;
}

// A tab's panel is mounted the first time it opens and then only hidden, so a search or a trimmed plan
// survives switching back and forth.
function SponsorshipTabs({ tabs, initialTab }: SponsorshipTabsProps) {
  const start = initialTab && tabs.includes(initialTab) ? initialTab : tabs[0];
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
      <Tabs tabs={tabs} active={tab} onChange={open} labels={TAB_LABELS} badges={TAB_BADGES} className="flex-wrap" />
      {tabs.map((t) =>
        opened.has(t) ? (
          <div key={t} role="tabpanel" aria-label={`${TAB_LABELS[t]} (${TAB_BADGES[t].toLowerCase()})`} hidden={t !== tab}>
            {t === "planner" ? <CampaignPlanner /> : <FindOrganizations />}
          </div>
        ) : null
      )}
    </div>
  );
}
