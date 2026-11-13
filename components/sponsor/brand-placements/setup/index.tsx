"use client";

import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import type { BrandAsset } from "@/components/sponsor/brand-assets/data";
import Creatives from "@/components/sponsor/brand-placements/setup/creatives";
import LogoVariants from "@/components/sponsor/brand-placements/setup/logo-variants";
import { useLogoVariants } from "@/components/sponsor/brand-placements/setup/logo-variants/use-logo-variants";
import StatsStrip from "@/components/sponsor/brand-placements/setup/stats-strip";
import PurchasedInventory from "@/components/sponsor/brand-placements/purchased-inventory";

interface PlacementsSetupProps {
  // The creatives library, shared with the page's "Upload creative" button.
  assets: BrandAsset[];
  // The id for the Purchased Inventory section, so Performance can scroll to it.
  inventoryId: string;
}

// The "Set up placements" tab: slot counts, creatives, logo versions and the slots bought (live).
export default function PlacementsSetup({ assets, inventoryId }: PlacementsSetupProps) {
  const account = useSponsorAccount();
  const brandName = account?.brandName || account?.displayName || "Your brand";
  const logos = useLogoVariants(account?.logoUrl ?? null);

  return (
    <div className="flex flex-col gap-7">
      <StatsStrip logosUploaded={logos.uploaded} logoTotal={logos.variants.length} />
      <Creatives assets={assets} />
      <LogoVariants variants={logos.variants} uploaded={logos.uploaded} brandName={brandName} onUpload={logos.upload} />
      <div id={inventoryId} className="scroll-mt-6">
        <PurchasedInventory />
      </div>
    </div>
  );
}
