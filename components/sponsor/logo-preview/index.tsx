"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import type { LogoVariant } from "@/utils/types/sponsor-brand-assets";

// The background each kind sits on in the app: white screens, dark screens, a square badge.
const BACKGROUND: Record<LogoVariant, string> = {
  FULL_COLOR: "bg-white text-black border border-[#d4d4d8]",
  WHITE: "bg-black text-white border border-[#3a3f4b]",
  ICON: "bg-white text-black",
};

interface LogoPreviewProps {
  // A permanent logo link (or the profile's signed one); null when there's no logo of this kind.
  url: string | null;
  variant: LogoVariant;
  // Shown, faded, while there's no logo or it fails to load (an icon shows its first letter).
  brandName: string;
  alt?: string;
  // The box's size, radius and fallback text size, e.g. "h-[84px] rounded-[10px] text-[26px]".
  className?: string;
  // Space around the logo inside the box.
  imageClassName?: string;
}

// A logo on its kind's background (Logo Variants, the Brand Assets logos, the slot picker and fan preview).
export default function LogoPreview({ url, variant, brandName, alt = "", className, imageClassName = "p-3" }: LogoPreviewProps) {
  // The URL that failed to load (a deleted logo answers 404); a new one is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const icon = variant === "ICON";

  return (
    <div
      className={cn(
        "relative flex flex-none items-center justify-center overflow-hidden font-display font-black tracking-[0.5px]",
        BACKGROUND[variant],
        className
      )}
    >
      {url && url !== failedUrl ? (
        // A backend link that redirects to storage, so skip the image optimizer.
        <Image src={url} alt={alt} fill unoptimized onError={() => setFailedUrl(url)} className={cn("object-contain", imageClassName)} />
      ) : (
        <span aria-hidden="true" className="opacity-35 truncate px-1">
          {icon ? brandName.charAt(0).toLowerCase() : brandName.toLowerCase()}
        </span>
      )}
    </div>
  );
}
