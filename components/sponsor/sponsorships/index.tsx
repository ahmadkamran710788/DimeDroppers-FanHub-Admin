"use client";

import { useState } from "react";
import Tabs from "@/components/common/tabs";
import CampaignPlanner from "@/components/sponsor/campaign-planner";
import FindOrganizations from "@/components/sponsor/find-organizations";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";

export type SponsorshipTab = "planner" | "find";

const TAB_LABELS: Record<SponsorshipTab, string> = {
  planner: "Campaign Planner",
  find: "Find Organizations",
};

// Campaign Planner is for national accounts only, and opens first for them.
const TABS: SponsorshipTab[] = SPONSOR_PROFILE.nationalAccount ? ["planner", "find"] : ["find"];

const tabOf = (label: string) => TABS.find((t) => TAB_LABELS[t] === label) ?? TABS[0];

interface SponsorshipsProps {
  // From ?tab=; ignored when the account doesn't have that tab.
  initialTab?: SponsorshipTab;
}

// The Sponsorships page: Dime AI's Campaign Planner and Find Organizations as tabs. A tab's panel is
// mounted the first time it opens and then only hidden, so a search or a trimmed plan survives
// switching back and forth.
export default function Sponsorships({ initialTab }: SponsorshipsProps) {
  const start = initialTab && TABS.includes(initialTab) ? initialTab : TABS[0];
  const [tab, setTab] = useState<SponsorshipTab>(start);
  const [opened, setOpened] = useState<ReadonlySet<SponsorshipTab>>(new Set([start]));

  function open(label: string) {
    const next = tabOf(label);
    setTab(next);
    setOpened((prev) => new Set(prev).add(next));
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <Tabs
        tabs={TABS.map((t) => TAB_LABELS[t])}
        active={TAB_LABELS[tab]}
        onChange={open}
        badges={{ [TAB_LABELS.planner]: "NATIONAL" }}
        className="flex-wrap"
      />
      {TABS.map((t) =>
        opened.has(t) ? (
          <div key={t} role="tabpanel" aria-label={TAB_LABELS[t]} hidden={t !== tab}>
            {t === "planner" ? <CampaignPlanner /> : <FindOrganizations />}
          </div>
        ) : null
      )}
    </div>
  );
}
