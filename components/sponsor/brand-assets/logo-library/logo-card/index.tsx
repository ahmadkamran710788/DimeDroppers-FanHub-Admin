"use client";

import { useRef } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatFileSize } from "@/utils/helper";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import LogoPreview from "@/components/sponsor/logo-preview";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import type { BrandAsset } from "@/utils/types/sponsor-brand-assets";

// The outlined look of the card's Replace and "More actions" buttons, as on the asset cards.
const CARD_BUTTON = cn(OUTLINE_BUTTON, "h-11 rounded-[10px]");
const BADGE = "text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap";

const FORMATS: Record<string, string> = { "image/svg+xml": "SVG", "image/png": "PNG", "image/jpeg": "JPG" };

// "Full-color logo · PNG · 1000×200 · 18 KB": every kind shares the library grid, so the kind leads.
const fileLine = (asset: BrandAsset) =>
  [
    asset.variantLabel,
    FORMATS[asset.mimeType] ?? asset.mimeType,
    asset.width && asset.height ? `${asset.width}×${asset.height}` : null,
    formatFileSize(asset.sizeBytes),
  ]
    .filter(Boolean)
    .join(" · ");

// Where the logo shows: picked for slots, or (the default) every slot without its own pick.
function usageLine(asset: BrandAsset) {
  const picked = asset.usedBy.slotTypes + asset.usedBy.slots;
  if (picked) return `Picked for ${picked} placement${picked === 1 ? "" : "s"}`;
  return asset.isDefault ? "Shown on your slots by default" : "Not picked for a slot yet";
}

interface LogoCardProps {
  asset: BrandAsset;
  brandName: string;
  // A change to this logo is being saved; its buttons wait.
  busy: boolean;
  // The file picker filter for its kind.
  accept: string;
  onReplace: (file: File) => void;
  onMakeDefault: () => void;
  onRename: () => void;
  // Full-color logos only: make the white logo and icon from it again.
  onRegenerate?: () => void;
  onDelete: () => void;
}

// One logo in the Brand Assets library: on its kind's background, with Default / Auto-made, where it's used and,
// on a full-color logo, the versions that couldn't be made from it.
export default function LogoCard({
  asset,
  brandName,
  busy,
  accept,
  onReplace,
  onMakeDefault,
  onRename,
  onRegenerate,
  onDelete,
}: LogoCardProps) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const generation = asset.generation;
  const notMade = generation?.results.filter((r) => r.state === "NEEDS_UPLOAD" && r.reason) ?? [];

  const actions: RowAction[] = [
    ...(asset.isDefault ? [] : [{ label: "Make default", onSelect: onMakeDefault }]),
    { label: "Rename", onSelect: onRename },
    ...(onRegenerate ? [{ label: "Remake white logo & icon", onSelect: onRegenerate }] : []),
    { label: "Delete", variant: "destructive" as const, onSelect: onDelete },
  ];

  return (
    <article className="bg-[#141414] border border-[#222] rounded-[8px] overflow-hidden flex flex-col">
      <LogoPreview
        url={asset.url}
        variant={asset.variant}
        brandName={brandName}
        alt={asset.name}
        className={cn("h-[120px] rounded-none border-0 border-b border-[#222]", asset.variant === "ICON" ? "text-[34px]" : "text-[26px]")}
        imageClassName="p-4"
      />

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between gap-2 items-start">
          <h4 className="min-w-0 break-words text-base font-bold">{asset.name}</h4>
          <div className="flex flex-wrap justify-end gap-1 shrink-0">
            {asset.isDefault && <span className={cn(BADGE, "bg-[#2a2148] text-[#d9ccff]")}>Default</span>}
            {asset.source === "GENERATED" && <span className={cn(BADGE, "bg-[#1e222a] text-[#d4d4d8]")}>Auto-made</span>}
          </div>
        </div>
        <div className="text-[13px] text-[#bdbdbd]">{fileLine(asset)}</div>
        <div className="text-[13px] text-[#a8a8a8]">{usageLine(asset)}</div>
        {asset.source === "GENERATED" && (
          <div className="text-[13px] text-[#a8a8a8]">Made from your full-color logo. Replace it with your own any time.</div>
        )}
        {generation?.status === "FAILED" && (
          <p className="text-[13px] leading-normal text-[#fcd34d]">
            {generation.error ?? "The white logo and icon couldn't be made from this logo."} Upload them yourself.
          </p>
        )}
        {notMade.map((r) => (
          <p key={r.variant} className="text-[13px] leading-normal text-[#fcd34d]">
            {r.reason}
          </p>
        ))}

        {/* mt-auto pins the actions to the card bottom, so every card in a row lines up. */}
        <div className="flex gap-2 mt-auto pt-[6px]">
          <Button
            label={busy ? "Saving…" : "Replace"}
            disabled={busy}
            onClick={() => replaceRef.current?.click()}
            className={cn(CARD_BUTTON, "flex-1 px-3 text-sm font-semibold")}
          />
          {!busy && (
            <RowActionsMenu
              ariaLabel={`More actions for ${asset.name}`}
              className={cn(CARD_BUTTON, "size-11 px-0 outline-0 hover:bg-white/5")}
              trigger={<Ellipsis className="size-5" />}
              items={actions}
            />
          )}
          <HiddenFileInput ref={replaceRef} accept={accept} onFiles={(files) => onReplace(files[0])} />
        </div>
      </div>
    </article>
  );
}
