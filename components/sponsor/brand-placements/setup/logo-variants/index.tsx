"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import { CARD, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_TITLE } from "@/components/sponsor/styles";
import { LOGO_ACCEPT, LOGO_VARIANT_DETAILS } from "@/components/sponsor/brand-placements/data";
import type { LogoVariant, LogoVariantId } from "@/components/sponsor/brand-placements/setup/logo-variants/use-logo-variants";

// The tile each version sits on: light screens, dark screens, a small square spot.
const TILE: Record<LogoVariantId, string> = {
  FULL_COLOR: "bg-white text-black border border-[#d4d4d8]",
  WHITE: "bg-black text-white border border-[#3a3f4b]",
  ICON: "bg-white text-black",
};

interface LogoVariantsProps {
  variants: LogoVariant[];
  uploaded: number;
  brandName: string;
  onUpload: (id: LogoVariantId, file: File) => void;
}

// The logo versions different screens call for, with Upload / Replace for each.
export default function LogoVariants({ variants, uploaded, brandName, onUpload }: LogoVariantsProps) {
  const missing = variants.length - uploaded;

  return (
    <section aria-labelledby="logo-variants-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="logo-variants-title" className={SECTION_TITLE}>
          Logo Variants
        </h3>
        <span className={cn("text-[13px]", missing ? "text-[#fcd34d]" : "text-[#86efac]")}>
          {missing ? `${uploaded} of ${variants.length} uploaded · ${missing} missing` : `All ${variants.length} uploaded`}
        </span>
      </div>
      <p className="max-w-[760px] text-sm leading-normal text-[#a8a8a8]">
        Different screens need different versions of your logo. Each slot below uses the version its screen calls for.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {variants.map((v) => (
          <VariantCard key={v.id} variant={v} brandName={brandName} onUpload={(file) => onUpload(v.id, file)} />
        ))}
      </div>
    </section>
  );
}

interface VariantCardProps {
  variant: LogoVariant;
  brandName: string;
  onUpload: (file: File) => void;
}

function VariantCard({ variant, brandName, onUpload }: VariantCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const details = LOGO_VARIANT_DETAILS[variant.id];
  const has = variant.file !== null;
  const action = has ? "Replace" : "Upload";

  return (
    <div className={cn(CARD, "rounded-[12px] p-[14px] flex flex-col gap-3", !has && "border-[#854d0e]")}>
      <VariantTile variant={variant} brandName={brandName} />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold">{variant.name}</span>
          <span
            className={cn(
              "text-[11px] font-bold rounded-full px-2 py-0.5",
              has ? "bg-[#052e16] text-[#86efac]" : "bg-[#2b1d05] text-[#fcd34d]"
            )}
          >
            {has ? "Uploaded" : "Missing"}
          </span>
        </div>
        <span className="text-xs text-[#a8a8a8]">{details.spec}</span>
        <span className="text-xs text-[#d4d4d8]">Used on: {details.usedOn.join(", ")}</span>
        <span className="text-xs text-[#a8a8a8] truncate">{variant.file?.name ?? "Not uploaded"}</span>
      </div>
      <Button
        label={action}
        icon={<Upload className="size-[15px]" strokeWidth={2} />}
        aria-label={`${action} ${variant.name.toLowerCase()}`}
        onClick={() => inputRef.current?.click()}
        className={cn(
          has ? OUTLINE_BUTTON : PRIMARY_BUTTON,
          "self-start h-10 px-[14px] gap-1.5 rounded-[8px] text-[13px] font-semibold"
        )}
      />
      <HiddenFileInput ref={inputRef} accept={LOGO_ACCEPT} onFiles={(files) => onUpload(files[0])} />
    </div>
  );
}

// The logo on its screen's background; the brand name, faded, while it's missing or fails to load.
function VariantTile({ variant, brandName }: { variant: LogoVariant; brandName: string }) {
  // The logo URL that failed to load (an expired signed link); a new one is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = variant.file?.url;
  const icon = variant.id === "ICON";

  return (
    <div
      className={cn(
        "relative h-[84px] rounded-[10px] overflow-hidden flex items-center justify-center",
        "font-display font-black tracking-[0.5px]",
        icon ? "text-[34px]" : "text-[26px]",
        TILE[variant.id]
      )}
    >
      {url && url !== failedUrl ? (
        // A local blob: preview or the profile's signed link, so skip the image optimizer.
        <Image src={url} alt={variant.name} fill unoptimized onError={() => setFailedUrl(url)} className="object-contain p-3" />
      ) : (
        <span aria-hidden="true" className="opacity-35 truncate px-3">
          {icon ? brandName.charAt(0).toLowerCase() : brandName.toLowerCase()}
        </span>
      )}
    </div>
  );
}
