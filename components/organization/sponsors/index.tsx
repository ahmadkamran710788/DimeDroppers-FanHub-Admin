"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button";
import Tabs from "@/components/common/tabs";
import PackagesPreview from "@/components/organization/sponsors/packages-preview";
import SponsorshipsList from "@/components/organization/sponsors/sponsorships-list";
import { routes } from "@/utils/routes";

const TABS = ["Sponsorships", "What Sponsors Can Buy"] as const;
type Tab = (typeof TABS)[number];

// Sponsors: who sponsors the organization (Sponsorships) and what sponsors can buy, one tab each. Both stay mounted,
// so switching tabs keeps unsaved max prices and the table's page, filter and search.
export default function SponsorsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Sponsorships");

  return (
    <div className="flex flex-col gap-10">
      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Sponsors
          </h2>
          <p className="text-base leading-[26px]">Who sponsors you, and the packages they can buy.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Button
            label="Add Add-On"
            className="shrink-0 whitespace-nowrap w-[177px]"
            onClick={() => router.push(routes.ui.sponsorAddOns)}
          />
          <Button
            variant="cta"
            label="Add Sponsor"
            className="shrink-0 whitespace-nowrap w-[177px]"
            onClick={() => router.push(routes.ui.addSponsor)}
          />
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div role="tabpanel" hidden={tab !== "Sponsorships"}>
        <SponsorshipsList />
      </div>
      <div role="tabpanel" hidden={tab !== "What Sponsors Can Buy"}>
        <PackagesPreview />
      </div>
    </div>
  );
}
