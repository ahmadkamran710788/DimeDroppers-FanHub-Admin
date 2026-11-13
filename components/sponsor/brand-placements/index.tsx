"use client";

import { useRef, useState } from "react";
import { ChartColumn, Crosshair, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import Tabs from "@/components/common/tabs";
import { PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { UPLOAD_ACCEPT } from "@/components/sponsor/brand-assets/data";
import { useAssetLibrary } from "@/components/sponsor/brand-assets/use-asset-library";
import PlacementsSetup from "@/components/sponsor/brand-placements/setup";
import Performance from "@/components/sponsor/brand-placements/performance";
import { PLACEMENTS_TAB_LABELS, PLACEMENTS_TABS, type PlacementsTab } from "@/components/sponsor/brand-placements/data";
import { routes } from "@/utils/routes";

// The id of the Purchased Inventory section, scrolled to from Performance.
const INVENTORY_ID = "purchased-inventory";

const TAB_ICONS: Record<PlacementsTab, React.ReactNode> = {
  setup: <Crosshair className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />,
  performance: <ChartColumn className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />,
};

interface BrandPlacementsProps {
  initialTab?: PlacementsTab;
}

// How the sponsor's brand shows up in the slots they bought (Set up placements) and how those slots did
// (Performance). Only Purchased Inventory is on the API; the rest runs on mock data in memory.
export default function BrandPlacements({ initialTab = "setup" }: BrandPlacementsProps) {
  const [tab, setTab] = useState<PlacementsTab>(initialTab);
  const uploadRef = useRef<HTMLInputElement>(null);
  // The creatives: the Brand Assets library (mock until the assets API exists).
  const { assets, addFiles } = useAssetLibrary();

  function pickTab(next: PlacementsTab) {
    setTab(next);
    window.history.replaceState(null, "", routes.ui.sponsor.brandPlacementsTab(next));
  }

  // From a slot on Performance back to setting slots up.
  function editSetup() {
    pickTab("setup");
    requestAnimationFrame(() => document.getElementById(INVENTORY_ID)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap gap-5 items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Brand Placements
          </h2>
          <p className="max-w-[720px] text-base leading-[26px] text-[#e5e5e5]">
            Every slot you buy starts as a simple brand placement (BPA) that shows only your logo. For any organization
            you can switch a slot to send fans to your site, run a survey or give an offer.
          </p>
        </div>
        <Button
          label="Upload creative"
          icon={<Upload className="size-[18px]" strokeWidth={2} />}
          onClick={() => uploadRef.current?.click()}
          className={cn(PRIMARY_BUTTON, "h-[46px] px-[18px] gap-2 rounded-[10px] text-[15px] font-semibold")}
        />
        <HiddenFileInput ref={uploadRef} accept={UPLOAD_ACCEPT.all} onFiles={(files) => addFiles(files, "All")} />
      </div>

      <Tabs
        tabs={PLACEMENTS_TABS}
        active={tab}
        onChange={pickTab}
        labels={PLACEMENTS_TAB_LABELS}
        icons={TAB_ICONS}
        className="flex-wrap gap-y-3"
      />

      {/* Both stay mounted, so uploads and the inventory picks survive a switch. */}
      <div className={cn(tab !== "setup" && "hidden")}>
        <PlacementsSetup assets={assets} inventoryId={INVENTORY_ID} />
      </div>
      <div className={cn(tab !== "performance" && "hidden")}>
        <Performance onEditSetup={editSetup} />
      </div>
    </div>
  );
}
