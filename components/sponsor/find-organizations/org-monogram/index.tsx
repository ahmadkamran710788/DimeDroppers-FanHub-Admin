"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface OrgMonogramProps {
  // The organization's logo; a building icon stands in without one, or when it fails to load.
  logoUrl?: string | null;
  // "lg": 56px, in the organization list. "md": 52px, in the packages panel.
  size?: "md" | "lg";
}

// An organization's logo, or a placeholder tile.
export default function OrgMonogram({ logoUrl, size = "lg" }: OrgMonogramProps) {
  // The logo URL that failed to load; another organization's logo is still tried.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const box = size === "lg" ? "size-14" : "size-[52px]";
  if (logoUrl && logoUrl !== failedUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        onError={() => setFailedUrl(logoUrl)}
        className={cn(box, "flex-none rounded-[12px] object-cover bg-white")}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(box, "flex-none rounded-[12px] flex items-center justify-center bg-[#222] text-[#a8a8a8]")}
    >
      <Building2 className={size === "lg" ? "size-7" : "size-6"} strokeWidth={1.5} />
    </div>
  );
}
