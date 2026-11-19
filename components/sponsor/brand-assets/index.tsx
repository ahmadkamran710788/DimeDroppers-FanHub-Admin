"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { useBrandLogos } from "@/components/sponsor/use-brand-logos";
import LogoFitModal from "@/components/sponsor/logo-fit";
import BrandProfile from "@/components/sponsor/brand-assets/brand-profile";
import LogoLibrary from "@/components/sponsor/brand-assets/logo-library";
import PlacementSpecs from "@/components/sponsor/brand-assets/placement-specs";

// The sponsor's brand kit, which organizations pull from when they place the brand: the library of logos
// (live), the brand profile and the placement specs organizations ask for (mock until their APIs exist).
export default function BrandAssets() {
  // The library's file input; "Upload assets" opens it too.
  const uploadRef = useRef<HTMLInputElement>(null);
  const logos = useBrandLogos();
  const uploading = logos.busy?.startsWith("upload:") ?? false;

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
        <Button
          label={uploading ? "Uploading…" : "Upload assets"}
          icon={<Upload className="size-5" strokeWidth={2} />}
          disabled={uploading}
          onClick={() => uploadRef.current?.click()}
          className={cn(PRIMARY_BUTTON, "h-[52px] px-[22px] gap-[10px] rounded-[12px] text-base")}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <BrandProfile />
        <LogoLibrary logos={logos} inputRef={uploadRef} />
      </div>

      <PlacementSpecs />

      {/* Every logo picked here is fitted to its slot's frame before it goes up. */}
      <LogoFitModal logos={logos} />
    </div>
  );
}
