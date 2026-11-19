"use client";

import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import { useBrandLogos } from "@/components/sponsor/use-brand-logos";
import LogoFitModal from "@/components/sponsor/logo-fit";
import type { BrandAsset } from "@/components/sponsor/brand-assets/data";
import Creatives from "@/components/sponsor/brand-placements/setup/creatives";
import LogoVariants from "@/components/sponsor/brand-placements/setup/logo-variants";
import StatsStrip from "@/components/sponsor/brand-placements/setup/stats-strip";
import PurchasedInventory from "@/components/sponsor/brand-placements/purchased-inventory";

interface PlacementsSetupProps {
  // The creatives library, shared with the page's "Upload creative" button.
  assets: BrandAsset[];
  // The id for the Purchased Inventory section, so Performance can scroll to it.
  inventoryId: string;
}

// The "Set up placements" tab: slot counts, creatives, logo versions (live) and the slots bought (live). The
// logos are shared with Purchased Inventory, which picks the logo each slot shows.
export default function PlacementsSetup({ assets, inventoryId }: PlacementsSetupProps) {
  const account = useSponsorAccount();
  const brandName = account?.brandName || account?.displayName || "Your brand";
  const logos = useBrandLogos();

  return (
    <div className="flex flex-col gap-7">
      <StatsStrip logoSummary={logos.list?.summary ?? null} />
      <Creatives assets={assets} />
      <LogoVariants logos={logos} brandName={brandName} />
      <div id={inventoryId} className="scroll-mt-6">
        <PurchasedInventory logos={logos} brandName={brandName} />
      </div>

      {/* Logo Variants and the slot editor upload through useBrandLogos, which fits each logo here first. */}
      <LogoFitModal logos={logos} />
    </div>
  );
}
