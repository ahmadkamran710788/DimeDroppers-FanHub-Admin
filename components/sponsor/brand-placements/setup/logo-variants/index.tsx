"use client";

import { useRef } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import Loader from "@/components/common/loader";
import LoadProblem from "@/components/sponsor/load-problem";
import LogoPreview from "@/components/sponsor/logo-preview";
import { isSquareLogo, logoAccept } from "@/components/sponsor/data";
import { CARD, HINT_LINK, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_TITLE } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import { routes } from "@/utils/routes";
import type { VariantState, VariantStatus } from "@/utils/types/sponsor-brand-assets";

const BADGE: Record<VariantState, { label: string; style: string }> = {
  READY: { label: "Uploaded", style: "bg-[#052e16] text-[#86efac]" },
  MISSING: { label: "Missing", style: "bg-[#2b1d05] text-[#fcd34d]" },
  NOT_NEEDED: { label: "Not needed yet", style: "bg-[#1e222a] text-[#d4d4d8]" },
};

interface LogoVariantsProps {
  logos: BrandLogos;
  brandName: string;
}

// The logo kinds the sponsor's slots call for, each with what's in use and Upload / Replace. The full list
// (several logos per kind, default, rename, delete) and the main logo are on Brand Assets.
export default function LogoVariants({ logos, brandName }: LogoVariantsProps) {
  const { list } = logos;

  function summary() {
    if (!list) return null;
    const { ready, missing, total } = list.summary;
    if (missing) return { text: `${ready} of ${total} uploaded · ${missing} missing`, style: "text-[#fcd34d]" };
    return { text: ready === total ? `All ${total} uploaded` : `${ready} of ${total} uploaded · every slot covered`, style: "text-[#86efac]" };
  }
  const line = summary();

  function body() {
    if (logos.loading) return <Loader />;
    if (!list) return <LoadProblem message={`Couldn't load your logos: ${logos.error}`} onRetry={logos.retry} />;
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {list.variants.map((v) => (
          <VariantCard key={v.variant} status={v} logos={logos} brandName={brandName} />
        ))}
      </div>
    );
  }

  return (
    <section aria-labelledby="logo-variants-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="logo-variants-title" className={SECTION_TITLE}>
          Logo Variants
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {line && <span className={cn("text-[13px]", line.style)}>{line.text}</span>}
          <Link href={routes.ui.sponsor.brandAssets} className={cn(HINT_LINK, "text-[13px]")}>
            Manage logos
          </Link>
        </div>
      </div>
      <p className="max-w-[760px] text-sm leading-normal text-[#a8a8a8]">
        {logos.mainLogo === "CIRCULAR"
          ? "Different screens need different versions of your logo. Your main logo is your circular logo, so nothing is made from it: upload your white logo and icon yourself."
          : "Different screens need different versions of your logo. Your main logo is your landscape logo: we make the white logo and icon from it, and you can upload your own to replace them."}
      </p>
      {body()}
    </section>
  );
}

interface VariantCardProps {
  status: VariantStatus;
  logos: BrandLogos;
  brandName: string;
}

function VariantCard({ status, logos, brandName }: VariantCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const spec = logos.specOf(status.variant);
  const items = logos.list?.items ?? [];
  const current = items.find((a) => a.id === status.defaultAssetId) ?? null;
  const fromProfile = status.inUse.source === "PROFILE";
  // No circular logo yet: Partner Offers shows the default icon meanwhile.
  const iconFallback = status.variant === "CIRCULAR" && !status.defaultAssetId && Boolean(status.inUse.url);
  const has = status.state === "READY" && !iconFallback;
  const badge = iconFallback ? { label: "Showing your icon", style: BADGE.NOT_NEEDED.style } : BADGE[status.state];
  // A landscape default keeps its id when replaced (every slot on it updates, the versions are made again);
  // any other upload becomes the default of its kind, taking over from a made one.
  const replacing = status.variant === "FULL_COLOR" && current ? current : null;
  const busy = logos.busy === `upload:${status.variant}` || (replacing !== null && logos.busy === replacing.id);
  const action = has && !fromProfile ? "Replace" : "Upload";

  function fileLine() {
    if (fromProfile) return "From your Sponsor Profile";
    if (iconFallback) return "Not uploaded · fans see your icon until you add one";
    if (current) return status.inUse.generated ? `${current.name} · Auto-made` : current.name;
    return "Not uploaded";
  }

  function pick(file: File) {
    if (replacing) logos.replace(replacing, file);
    else logos.upload(status.variant, file, { isDefault: true });
  }

  return (
    <div className={cn(CARD, "rounded-[12px] p-[14px] flex flex-col gap-3", status.state === "MISSING" && "border-[#854d0e]")}>
      <LogoPreview
        url={status.inUse.url}
        variant={status.variant}
        brandName={brandName}
        alt={status.label}
        className={cn("h-[84px] rounded-[10px]", isSquareLogo(status.variant) ? "text-[34px]" : "text-[26px]")}
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold">{status.label}</span>
          <span className={cn("text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap", badge.style)}>{badge.label}</span>
        </div>
        {spec && <span className="text-xs text-[#a8a8a8]">{spec.description}</span>}
        {spec && <span className="text-xs text-[#d4d4d8]">Used on: {spec.usedOn.join(", ")}</span>}
        <span className="text-xs text-[#a8a8a8]">
          {status.neededBySlots
            ? `${status.neededBySlots} of your slot${status.neededBySlots === 1 ? "" : "s"} show${status.neededBySlots === 1 ? "s" : ""} it`
            : "None of your slots show it yet"}
        </span>
        <span className="text-xs text-[#a8a8a8] truncate">{fileLine()}</span>
        {status.needsUpload && <span className="text-xs leading-normal text-[#fcd34d]">{status.needsUpload}</span>}
      </div>
      <Button
        label={busy ? "Uploading…" : action}
        icon={<Upload className="size-[15px]" strokeWidth={2} />}
        aria-label={`${action} ${status.label.toLowerCase()}`}
        disabled={busy || !spec}
        onClick={() => inputRef.current?.click()}
        className={cn(
          has ? OUTLINE_BUTTON : PRIMARY_BUTTON,
          "self-start mt-auto h-10 px-[14px] gap-1.5 rounded-[8px] text-[13px] font-semibold"
        )}
      />
      {spec && <HiddenFileInput ref={inputRef} accept={logoAccept(spec)} onFiles={(files) => pick(files[0])} />}
    </div>
  );
}
