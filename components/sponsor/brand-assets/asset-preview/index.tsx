import Image from "next/image";
import { FileText } from "lucide-react";
import BrandLogo from "@/components/sponsor/brand-logo";
import { BRAND_LOGO, type BrandAsset } from "@/components/sponsor/brand-assets/data";

interface AssetPreviewProps {
  asset: BrandAsset;
  // md: the library cards. sm: the smaller creative tiles on Brand Placements.
  size?: "sm" | "md";
}

// An asset's thumbnail: the uploaded file, or the drawn brand logo for mock assets. Place it in a
// `relative` box with the asset's background.
export default function AssetPreview({ asset, size = "md" }: AssetPreviewProps) {
  if (!asset.file) {
    return <BrandLogo size={size} wordmark={BRAND_LOGO.wordmark} markFill={asset.markFill} wordColor={asset.wordColor} />;
  }
  if (asset.file.kind === "image") {
    // Local blob: preview, so skip the image optimizer.
    return (
      <Image src={asset.file.url} alt={asset.name} fill unoptimized className={size === "sm" ? "object-contain p-3" : "object-contain p-4"} />
    );
  }
  if (asset.file.kind === "video") {
    return <video src={asset.file.url} muted preload="metadata" className="absolute inset-0 size-full object-cover" />;
  }
  return (
    <FileText
      className={size === "sm" ? "size-9 text-[#bdbdbd]" : "size-12 text-[#bdbdbd]"}
      strokeWidth={1.25}
      aria-label={`${asset.name} (PDF)`}
    />
  );
}
