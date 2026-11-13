import { cn } from "@/utils/cn";
import { CARD, SECTION_TITLE } from "@/components/sponsor/styles";
import AssetPreview from "@/components/sponsor/brand-assets/asset-preview";
import type { AssetType, BrandAsset } from "@/components/sponsor/brand-assets/data";

const KIND: Record<AssetType, string> = { Logos: "Logo", Video: "Video", Banners: "Banner", Social: "Social" };

interface CreativesProps {
  assets: BrandAsset[];
}

// The sponsor's creatives from Brand Assets, which slots can use.
export default function Creatives({ assets }: CreativesProps) {
  return (
    <section aria-labelledby="creatives-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="creatives-title" className={SECTION_TITLE}>
          Your Creatives
        </h3>
        <span className="text-[13px] text-[#a8a8a8]">
          From Brand Assets · {assets.length} placement{assets.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
        {assets.map((asset) => (
          <div key={asset.id} className={cn(CARD, "rounded-[12px] overflow-hidden flex flex-col")}>
            <div className="relative h-[92px] flex items-center justify-center overflow-hidden" style={{ background: asset.bg }}>
              <AssetPreview asset={asset} size="sm" />
            </div>
            <div className="px-3 py-[10px] flex flex-col gap-[3px]">
              <span className="text-sm font-medium truncate">{asset.name}</span>
              <span className="text-xs text-[#a8a8a8]">
                {KIND[asset.type]} · {asset.usage.charAt(0).toLowerCase() + asset.usage.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
