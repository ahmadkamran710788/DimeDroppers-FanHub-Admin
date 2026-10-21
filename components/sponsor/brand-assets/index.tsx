"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChips from "@/components/common/filter-chips";
import AssetCard from "@/components/sponsor/brand-assets/asset-card";
import AssetDropzone from "@/components/sponsor/brand-assets/asset-dropzone";
import BrandProfile from "@/components/sponsor/brand-assets/brand-profile";
import PlacementSpecs from "@/components/sponsor/brand-assets/placement-specs";
import { useAssetLibrary } from "@/components/sponsor/brand-assets/use-asset-library";
import { ASSET_FILTER_OPTIONS, type AssetFilter, type BrandAsset } from "@/components/sponsor/brand-assets/data";

// The sponsor's brand kit, which organizations pull from when they place the brand: the brand
// profile, the asset library and the placement specs organizations ask for.
export default function BrandAssets() {
  const [filter, setFilter] = useState<AssetFilter>("All");
  const [deleting, setDeleting] = useState<BrandAsset | null>(null);
  // The drop zone's file input; "Upload assets" opens it too.
  const uploadRef = useRef<HTMLInputElement>(null);
  const { assets, addFiles, replaceFile, removeAsset } = useAssetLibrary();

  const shown = assets.filter((a) => filter === "All" || a.type === filter);

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
          label="Upload assets"
          icon={<Upload className="size-5" strokeWidth={2} />}
          onClick={() => uploadRef.current?.click()}
          className="h-[52px] min-w-0 px-[22px] gap-[10px] bg-[#6a4be6] text-white rounded-[12px] text-base font-bold backdrop-blur-none"
        />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <BrandProfile />

        <section aria-label="Asset library" className="flex-[2_1_520px] min-w-0 flex flex-col gap-[18px]">
          <AssetDropzone inputRef={uploadRef} onFiles={(files) => addFiles(files, filter)} />
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Library</h3>
            <FilterChips variant="pill" ariaLabel="Asset type" options={ASSET_FILTER_OPTIONS} value={filter} onChange={setFilter} />
          </div>
          {shown.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
              {shown.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onReplace={(file) => replaceFile(asset.id, file)}
                  onDelete={() => setDeleting(asset)}
                />
              ))}
            </div>
          ) : (
            <p className="text-base text-[#a8a8a8]">Nothing under {filter} yet. Drop files above to add some.</p>
          )}
        </section>
      </div>

      <PlacementSpecs />

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete asset"
        message={`Delete “${deleting?.name}”? Organizations using it will need another asset.`}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        destructive
        onConfirm={async () => {
          if (deleting) {
            removeAsset(deleting.id);
            toast.success(`${deleting.name} deleted`);
          }
          return true;
        }}
      />
    </div>
  );
}
