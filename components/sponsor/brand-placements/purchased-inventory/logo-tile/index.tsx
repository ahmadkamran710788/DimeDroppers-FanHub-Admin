"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

// swatch: on the logo picker. large: the Simple BPA slot in the fan preview.
const SIZES = {
  swatch: { box: "h-[26px] w-[34px] rounded-[6px] p-0.5 text-[11px]", px: 34 },
  large:{ box: "h-[72px] w-full rounded-[12px] p-2 text-2xl", px: 240 },
};

export interface SponsorBrand {
  name: string;
  // The full-color logo from the sponsor profile (a signed link), or null when none is uploaded.
  logoUrl: string | null;
}

interface LogoTileProps {
  brand: SponsorBrand;
  size: keyof typeof SIZES;
}

// The sponsor's full-color logo; the brand name as text while there is none (or it fails to load).
export default function LogoTile({ brand, size }: LogoTileProps) {
  // The logo URL that failed to load (an expired signed link); a new one is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { box, px } = SIZES[size];

  if (brand.logoUrl && brand.logoUrl !== failedUrl) {
    return (
      <span aria-hidden="true" className={cn("flex flex-none items-center justify-center overflow-hidden bg-white", box)}>
        <Image
          src={brand.logoUrl}
          alt=""
          width={px}
          height={px}
          unoptimized
          onError={() => setFailedUrl(brand.logoUrl)}
          className="max-h-full max-w-full w-auto h-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-none items-center justify-center overflow-hidden border border-dashed border-[#52525b]",
        "font-display font-black leading-none tracking-[0.5px] text-white uppercase",
        box
      )}
    >
      <span className="truncate">{size === "swatch" ? brand.name.charAt(0) : brand.name}</span>
    </span>
  );
}
