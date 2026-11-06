"use client";

import { useState } from "react";
import Tabs from "@/components/common/tabs";
import BrowseNeeds from "@/components/sponsor/fundable-needs/browse-needs";
import FundedNeeds from "@/components/sponsor/fundable-needs/funded-needs";
import { FUNDED_NEEDS } from "@/components/sponsor/fundable-needs/data";

export type FundableNeedsTab = "browse" | "funded";

const TABS: FundableNeedsTab[] = ["browse", "funded"];

const TAB_LABELS: Record<FundableNeedsTab, string> = {
  browse: "Browse needs",
  funded: "My funded needs",
};

interface FundableNeedsProps {
  // From ?tab=.
  initialTab?: FundableNeedsTab;
}

// Sponsor Fundable Needs: browse open asks and fund one, or follow the needs you've funded and how the
// organization spends them. Both panels stay mounted (only hidden), so Browse keeps its picked need.
export default function FundableNeeds({ initialTab = "browse" }: FundableNeedsProps) {
  const [tab, setTab] = useState<FundableNeedsTab>(initialTab);

  function open(next: FundableNeedsTab) {
    setTab(next);
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  return (
    // Spacing and title sizes follow the admin pages (gap-10, 56px title, 16px subtitle).
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          FUNDABLE NEEDS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Real asks from organizations near you. Fund one fully or chip in, and choose how your brand is recognized.
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={open}
        labels={TAB_LABELS}
        counts={{ funded: FUNDED_NEEDS.length }}
        className="flex-wrap"
      />
      {TABS.map((t) => (
        <div key={t} role="tabpanel" aria-label={TAB_LABELS[t]} hidden={t !== tab}>
          {t === "browse" ? <BrowseNeeds /> : <FundedNeeds />}
        </div>
      ))}
    </div>
  );
}
