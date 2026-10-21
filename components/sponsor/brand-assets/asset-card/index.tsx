"use client";

import Image from "next/image";
import { useRef } from "react";
import { Ellipsis, FileText, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import RowActionsMenu from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import BrandLogo from "@/components/sponsor/brand-logo";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import { BRAND_LOGO, UPLOAD_ACCEPT, type AssetStatus, type BrandAsset } from "@/components/sponsor/brand-assets/data";

// Status pill fill and text colors.
const STATUS_STYLES: Record<AssetStatus, { color: string; text: string }> = {
  Approved: { color: "bg-[#1d3a1e]", text: "text-[#a3e3a5]" },
  "In review": { color: "bg-[#3d2a12]", text: "text-[#ffc999]" },
  Draft: { color: "bg-[#262626]", text: "text-[#d4d4d4]" },
};

// The outlined look of the card's Replace and "More actions" buttons.
const CARD_BUTTON = cn(OUTLINE_BUTTON, "h-11 rounded-[10px]");

interface AssetCardProps {
  asset: BrandAsset;
  onReplace: (file: File) => void;
  onDelete: () => void;
}

export default function AssetCard({ asset, onReplace, onDelete }: AssetCardProps) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const status = STATUS_STYLES[asset.status];
  const isVideo = asset.type === "Video";

  return (
    <article className="bg-[#141414] border border-[#222] rounded-[8px] overflow-hidden flex flex-col">
      <div className="relative h-[140px] flex items-center justify-center" style={{ background: asset.bg }}>
        <AssetPreview asset={asset} />
        {isVideo && (
          <span className="absolute size-[52px] rounded-full bg-black/65 flex items-center justify-center">
            <Play className="size-5 text-white" fill="currentColor" aria-hidden="true" />
          </span>
        )}
        {asset.duration && (
          <span className="absolute right-[10px] bottom-[10px] text-xs font-bold bg-black/70 px-[7px] py-[3px] rounded-[6px]">
            {asset.duration}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between gap-2 items-start">
          <h3 className="min-w-0 break-words text-base font-bold">{asset.name}</h3>
          <StatusPill
            label={asset.status}
            color={status.color}
            className="h-auto px-2 py-1 shrink-0"
            textClassName={cn("text-xs font-bold whitespace-nowrap", status.text)}
          />
        </div>
        <div className="text-[13px] text-[#bdbdbd]">{asset.spec}</div>
        <div className="text-[13px] text-[#a8a8a8]">{asset.usage}</div>
        {/* mt-auto pins the actions to the card bottom, so every card in a row lines up. */}
        <div className="flex gap-2 mt-auto pt-[6px]">
          <Button
            label="Replace"
            onClick={() => replaceRef.current?.click()}
            className={cn(CARD_BUTTON, "flex-1 px-3 text-sm font-semibold")}
          />
          <RowActionsMenu
            ariaLabel={`More actions for ${asset.name}`}
            className={cn(CARD_BUTTON, "size-11 px-0 outline-0 hover:bg-white/5")}
            trigger={<Ellipsis className="size-5" />}
            items={[{ label: "Delete", variant: "destructive", onSelect: onDelete }]}
          />
          <HiddenFileInput
            ref={replaceRef}
            accept={isVideo ? UPLOAD_ACCEPT.video : UPLOAD_ACCEPT.files}
            onFiles={(files) => onReplace(files[0])}
          />
        </div>
      </div>
    </article>
  );
}

// The thumbnail: the uploaded file, or the drawn brand logo for mock assets.
function AssetPreview({ asset }: { asset: BrandAsset }) {
  if (!asset.file) {
    return <BrandLogo size="md" wordmark={BRAND_LOGO.wordmark} markFill={asset.markFill} wordColor={asset.wordColor} />;
  }
  if (asset.file.kind === "image") {
    // Local blob: preview, so skip the image optimizer.
    return <Image src={asset.file.url} alt={asset.name} fill unoptimized className="object-contain p-4" />;
  }
  if (asset.file.kind === "video") {
    return <video src={asset.file.url} muted preload="metadata" className="absolute inset-0 size-full object-cover" />;
  }
  return <FileText className="size-12 text-[#bdbdbd]" strokeWidth={1.25} aria-label={`${asset.name} (PDF)`} />;
}
