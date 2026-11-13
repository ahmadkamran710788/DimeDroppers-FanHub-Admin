"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/utils/helper";
import { UPLOAD_LIMITS } from "@/components/sponsor/brand-assets/data";
import { LOGO_EXTENSIONS } from "@/components/sponsor/brand-placements/data";
import { LOGO_VARIANTS } from "@/components/sponsor/brand-placements/purchased-inventory/data";

export type LogoVariantId = (typeof LOGO_VARIANTS)[number]["id"];

export interface LogoFile {
  url: string;
  name: string;
}

export interface LogoVariant {
  id: LogoVariantId;
  name: string;
  // The uploaded logo, or null while it's missing.
  file: LogoFile | null;
}

// The three logo versions slots call for. Uploads live in memory until the placements API exists; the
// full-color logo starts as the Sponsor Profile logo.
export function useLogoVariants(profileLogoUrl: string | null) {
  const [uploads, setUploads] = useState<Partial<Record<LogoVariantId, LogoFile>>>({});
  // Object URLs of uploaded files, revoked when replaced or when the page closes.
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const live = urls.current;
    return () => live.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const variants: LogoVariant[] = LOGO_VARIANTS.map((v) => ({
    id: v.id,
    name: v.name,
    file:
      uploads[v.id] ??
      (v.id === "FULL_COLOR" && profileLogoUrl ? { url: profileLogoUrl, name: "From your Sponsor Profile" } : null),
  }));

  function upload(id: LogoVariantId, file: File) {
    const name = LOGO_VARIANTS.find((v) => v.id === id)?.name.toLowerCase() ?? "logo";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!LOGO_EXTENSIONS.includes(ext)) {
      toast.error(`${file.name} isn't a PNG or SVG file`);
      return;
    }
    if (file.size > UPLOAD_LIMITS.maxFileBytes) {
      toast.error(`${file.name} is over ${formatFileSize(UPLOAD_LIMITS.maxFileBytes)}`);
      return;
    }
    const previous = uploads[id];
    if (previous) {
      URL.revokeObjectURL(previous.url);
      urls.current.delete(previous.url);
    }
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    setUploads((prev) => ({ ...prev, [id]: { url, name: file.name } }));
    toast.success(`${file.name} is now your ${name}`);
  }

  return { variants, uploaded: variants.filter((v) => v.file).length, upload };
}
