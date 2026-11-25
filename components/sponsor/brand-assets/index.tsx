"use client";

import { useBrandLogos } from "@/components/sponsor/use-brand-logos";
import LogoFitModal from "@/components/sponsor/logo-fit";
import BrandProfile from "@/components/sponsor/brand-assets/brand-profile";
import LogoLibrary from "@/components/sponsor/brand-assets/logo-library";
import LogoUploadButtons from "@/components/sponsor/brand-assets/logo-upload-buttons";
import PlacementSpecs from "@/components/sponsor/brand-assets/placement-specs";

// The sponsor's brand kit, which organizations pull from when they place the brand: the library of logos
// (live), the brand profile and the placement specs organizations ask for (mock until their APIs exist).
export default function BrandAssets() {
  const logos = useBrandLogos();

  return (
    // Spacing and title sizes follow the admin pages, as on Fundable Needs.
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-5 items-end justify-between">
        <div className="flex flex-col">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            BRAND ASSETS
          </h2>
          <p className="text-base leading-[26px] text-[#e5e5e5]">
            Keep your logos, videos and creative up to date. Organizations pull from here when they place your brand.
          </p>
        </div>
        <LogoUploadButtons logos={logos} />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <BrandProfile />
        <LogoLibrary logos={logos} />
      </div>

      <PlacementSpecs />

      {/* Edit on a logo card opens its logo here (drag, stretch, resize); the edited one replaces the file. */}
      <LogoFitModal logos={logos} />
    </div>
  );
}
