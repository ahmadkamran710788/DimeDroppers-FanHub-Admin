"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth";
import Loader from "@/components/common/loader";
import Tabs from "@/components/common/tabs";
import CampaignPlanner from "@/components/sponsor/campaign-planner";
import FindOrganizations from "@/components/sponsor/find-organizations";
import type { PlannerTier } from "@/components/sponsor/campaign-planner/data";
import type { SponsorTypeCode } from "@/utils/types/sponsor-profile";

export type SponsorshipTab = "planner" | "find";

// Both tabs are the Campaign Planner; the badge tells national, regional and local apart.
const TAB_LABELS: Record<SponsorshipTab, string> = {
  planner: "Campaign Planner",
  find: "Campaign Planner",
};

// The brand types that get Dime AI's planner; any other (a local business, or no brand yet) gets Find Organizations.
const PLANNER_TIERS: Partial<Record<SponsorTypeCode, PlannerTier>> = {
  NATIONAL_BRAND: "NATIONAL",
  REGIONAL_BRAND: "REGIONAL",
};

interface SponsorshipsProps {
  // From ?tab=; ignored when the account doesn't have that tab.
  initialTab?: SponsorshipTab;
}

// The Sponsorships page shows one tab, picked by the brand type chosen at sign-up (or changed on the Sponsor
// Profile): Dime AI's Campaign Planner for a national or regional brand, Find Organizations for a local
// business. It waits for the signed-in sponsor so the right tab shows from the start.
export default function Sponsorships({ initialTab }: SponsorshipsProps) {
  const { sponsor, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  const type = sponsor?.brand?.sponsorType;
  const tier = (type && PLANNER_TIERS[type]) ?? null;
  // Keyed, so a brand type changed on the Sponsor Profile starts the tabs afresh.
  return (
    <SponsorshipTabs
      key={tier ?? "local"}
      tabs={tier ? ["planner"] : ["find"]}
      tier={tier ?? "NATIONAL"}
      initialTab={initialTab}
    />
  );
}

interface SponsorshipTabsProps {
  tabs: SponsorshipTab[];
  // The planner's badge; unused when the planner isn't one of the tabs.
  tier: PlannerTier;
  initialTab?: SponsorshipTab;
}

// A tab's panel is mounted the first time it opens and then only hidden, so a search or a trimmed plan
// survives switching back and forth.
function SponsorshipTabs({ tabs, tier, initialTab }: SponsorshipTabsProps) {
  const start = initialTab && tabs.includes(initialTab) ? initialTab : tabs[0];
  const [tab, setTab] = useState<SponsorshipTab>(start);
  const [opened, setOpened] = useState<ReadonlySet<SponsorshipTab>>(new Set([start]));
  const badges: Record<SponsorshipTab, string> = { planner: tier, find: "LOCAL" };

  function open(next: SponsorshipTab) {
    setTab(next);
    setOpened((prev) => new Set(prev).add(next));
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <Tabs tabs={tabs} active={tab} onChange={open} labels={TAB_LABELS} badges={badges} className="flex-wrap" />
      {tabs.map((t) =>
        opened.has(t) ? (
          <div key={t} role="tabpanel" aria-label={`${TAB_LABELS[t]} (${badges[t].toLowerCase()})`} hidden={t !== tab}>
            {t === "planner" ? <CampaignPlanner tier={tier} /> : <FindOrganizations />}
          </div>
        ) : null
      )}
    </div>
  );
}
