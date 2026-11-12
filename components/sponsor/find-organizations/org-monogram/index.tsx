"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/utils/cn";

type MonogramSize = "sm" | "md" | "lg";

// The tile and the placeholder icon, per size.
const SIZES: Record<MonogramSize, { box: string; px: number; icon: string; radius: string; text: string }> = {
  // 40px: the Fundable Needs cards.
  sm: { box: "size-10", px: 40, icon: "size-5", radius: "rounded-[10px]", text: "text-[13px]" },
  // 52px: the packages panel.
  md: { box: "size-[52px]", px: 52, icon: "size-6", radius: "rounded-[12px]", text: "text-[15px]" },
  // 56px: the organization list.
  lg: { box: "size-14", px: 56, icon: "size-7", radius: "rounded-[12px]", text: "text-base" },
};

// "21st Century Charter School" → "2C".
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

interface OrgMonogramProps {
  // The organization's logo; a building icon stands in without one, or when it fails to load.
  logoUrl?: string | null;
  size?: MonogramSize;
  // With a name, its initials stand in for the building icon.
  name?: string | null;
}

// An organization's logo, or a placeholder tile.
export default function OrgMonogram({ logoUrl, size = "lg", name }: OrgMonogramProps) {
  // The logo URL that failed to load; another organization's logo is still tried.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { box, px, icon, radius, text } = SIZES[size];
  if (logoUrl && logoUrl !== failedUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={px}
        height={px}
        unoptimized
        onError={() => setFailedUrl(logoUrl)}
        className={cn(box, radius, "flex-none object-cover bg-white")}
      />
    );
  }
  const initials = name ? initialsOf(name) : "";
  if (initials) {
    return (
      <div
        aria-hidden="true"
        className={cn(box, radius, text, "flex-none flex items-center justify-center bg-[#2a2148] font-bold text-white")}
      >
        {initials}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(box, radius, "flex-none flex items-center justify-center bg-[#222] text-[#a8a8a8]")}
    >
      <Building2 className={icon} strokeWidth={1.5} />
    </div>
  );
}
