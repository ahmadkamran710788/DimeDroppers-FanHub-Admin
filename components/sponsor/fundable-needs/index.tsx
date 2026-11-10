"use client";

import { useEffect, useRef, useState } from "react";
import Tabs from "@/components/common/tabs";
import BrowseNeeds from "@/components/sponsor/fundable-needs/browse-needs";
import FundedNeeds from "@/components/sponsor/fundable-needs/funded-needs";
import { confirmContribution } from "@/components/sponsor/fundable-needs/confirm-contribution";
import { routes } from "@/utils/routes";

export type FundableNeedsTab = "browse" | "funded";

const TABS: FundableNeedsTab[] = ["browse", "funded"];

const TAB_LABELS: Record<FundableNeedsTab, string> = {
  browse: "Browse needs",
  funded: "My funded needs",
};

// A payment Stripe sent the sponsor back from (a redirect-based method), still to be confirmed.
export interface ReturnedPayment {
  contributionId: string;
  paymentIntentId: string;
}

interface FundableNeedsProps {
  // From ?tab=.
  initialTab?: FundableNeedsTab;
  // From ?contribution=&payment_intent= (Stripe's return_url).
  returnedPayment?: ReturnedPayment;
}

// Sponsor Fundable Needs: browse open needs and fund one, or follow the needs you've funded and how the
// organization spends them. Both panels stay mounted (only hidden), so Browse keeps its picked need.
export default function FundableNeeds({ initialTab = "browse", returnedPayment }: FundableNeedsProps) {
  const [tab, setTab] = useState<FundableNeedsTab>(initialTab);
  // Bumped after a payment: both tabs load again.
  const [refresh, setRefresh] = useState(0);
  // From the My funded needs list; unknown until it loads.
  const [fundedTotal, setFundedTotal] = useState<number | null>(null);
  // The returned payment is confirmed once, even when the effect runs twice in development.
  const confirmed = useRef(false);

  function open(next: FundableNeedsTab) {
    setTab(next);
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", routes.ui.sponsor.fundableNeedsTab(next));
  }

  useEffect(() => {
    if (!returnedPayment || confirmed.current) return;
    confirmed.current = true;
    // Drops Stripe's parameters, so a refresh doesn't confirm again.
    window.history.replaceState(null, "", routes.ui.sponsor.fundableNeedsTab("funded"));
    confirmContribution(returnedPayment.contributionId, returnedPayment.paymentIntentId).then(() =>
      setRefresh((n) => n + 1)
    );
  }, [returnedPayment]);

  return (
    // Spacing and title sizes follow the admin pages (gap-10, 56px title, 16px subtitle).
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          FUNDABLE NEEDS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Real asks from organizations near you. Fund one fully or chip in, and choose how your brand is shown.
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={open}
        labels={TAB_LABELS}
        counts={fundedTotal === null ? undefined : { funded: fundedTotal }}
        className="flex-wrap"
      />
      {TABS.map((t) => (
        <div key={t} role="tabpanel" aria-label={TAB_LABELS[t]} hidden={t !== tab}>
          {t === "browse" ? (
            <BrowseNeeds refresh={refresh} onFunded={() => setRefresh((n) => n + 1)} />
          ) : (
            <FundedNeeds refresh={refresh} onTotal={setFundedTotal} onBrowse={() => open("browse")} />
          )}
        </div>
      ))}
    </div>
  );
}
