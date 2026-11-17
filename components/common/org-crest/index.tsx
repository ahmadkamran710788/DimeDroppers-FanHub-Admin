"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { FALLBACK_CREST } from "@/utils/constants/fallback-crest";

interface OrgCrestProps {
  // Pixel size of the round crest.
  size: number;
  // The team's own logo, when it has one; else the organization's logo, else the neutral crest.
  logoUrl?: string | null;
  className?: string;
  // e.g. a team's ring colour as the border.
  style?: CSSProperties;
}

// A round team / organization crest.
export default function OrgCrest({ size, logoUrl, className, style }: OrgCrestProps) {
  const { savedSchool } = useSetup();
  const src = logoUrl || savedSchool?.logoUrl || FALLBACK_CREST;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      // An uploaded logo is a remote (presigned) URL with no configured image host.
      unoptimized={src.startsWith("http")}
      className={cn("shrink-0 rounded-full object-cover bg-black/40 border-2", className)}
      style={{ width: size, height: size, ...style }}
    />
  );
}
