import Link from "next/link";
import { Clock, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { CARD, HINT, HINT_LINK, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import LogoTile, { type SponsorBrand } from "@/components/sponsor/brand-assets/purchased-inventory/logo-tile";
import { LOGO_VARIANTS, TEMPLATES } from "@/components/sponsor/brand-assets/purchased-inventory/data";
import { routes } from "@/utils/routes";
import type { SlotChip } from "@/utils/types/sponsor-inventory";

const LEGEND = "text-xs font-semibold tracking-[1.2px] text-[#e4e4e7] pb-[10px]";
const OPTION = "border text-left text-white disabled:cursor-not-allowed";
const OPTION_ON = "bg-[#2a2148] border-[#8b6dff]";
const OPTION_OFF = "bg-[#0b0b0b] border-[#333] opacity-60";
const NOTE = "flex items-start gap-[10px] rounded-[10px] border border-[#333] bg-[#0b0b0b] px-[14px] py-3 text-[13px] leading-normal text-[#d4d4d8]";

interface SlotEditorProps {
  orgName: string;
  // The picked slot; null on "All slots".
  chip: SlotChip | null;
  // The packages the shown slots come from at this organization.
  packageNames: string[];
  // Organizations in the list, for "Use this setup for all N organizations".
  orgCount: number;
  brand: SponsorBrand;
}

// How the sponsor shows up on a slot (template, logo version, fields). Slot setup isn't in the API
// yet, so this shows the default (Simple BPA, full-color logo) with every control disabled.
export default function SlotEditor({ orgName, chip, packageNames, orgCount, brand }: SlotEditorProps) {
  const eyebrow = [chip?.categoryLabel, chip?.name ?? "All slots", packageNames.join(" / ")].filter(Boolean).join(" · ");

  return (
    <section
      aria-labelledby="slot-editor-title"
      className={cn(CARD, "flex-[3_1_360px] min-w-0 rounded-[14px] p-[22px] flex flex-col gap-5")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold tracking-[1px] text-[#a8a8a8]">{eyebrow.toUpperCase()}</span>
          <h4 id="slot-editor-title" className="font-display font-black text-2xl leading-tight">
            {orgName}
          </h4>
        </div>
        <span className="flex-none text-[11px] font-bold tracking-[1px] px-[9px] py-1 rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
          COMING SOON
        </span>
      </div>

      <div role="status" className={NOTE}>
        <Clock className="size-[18px] flex-none mt-px text-[#c7d2fe]" strokeWidth={1.8} aria-hidden="true" />
        <span>
          Slot setup is coming soon: you&apos;ll pick a template and logo for each slot here. For now every slot uses
          Simple BPA, the default.
        </span>
      </div>

      {/* A disabled fieldset disables every option inside it. */}
      <fieldset disabled className="flex flex-col">
        <legend className={LEGEND}>TEMPLATE</legend>
        <div role="radiogroup" aria-label="Template" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
          {TEMPLATES.map((t) => {
            const on = t.id === "SIMPLE_BPA";
            return (
              // An option card (icon, name, description), not an action button.
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={cn(OPTION, "flex flex-col items-start gap-1.5 p-[14px] rounded-[12px]", on ? OPTION_ON : OPTION_OFF)}
              >
                <t.icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="text-xs leading-[1.4] text-[#a8a8a8]">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled className="flex flex-col gap-[10px]">
        <legend className={LEGEND}>LOGO ON THIS SCREEN</legend>
        <div role="radiogroup" aria-label="Logo version" className="flex flex-wrap gap-2">
          {LOGO_VARIANTS.map((v) => {
            const on = v.id === "FULL_COLOR";
            return (
              // An option card (logo swatch, name, status), not an action button.
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={cn(OPTION, "flex items-center gap-[10px] min-h-12 px-3 py-1.5 rounded-[10px] text-[13px]", on ? OPTION_ON : OPTION_OFF)}
              >
                {on ? (
                  <LogoTile brand={brand} size="swatch" />
                ) : (
                  <span aria-hidden="true" className="h-[26px] w-[34px] flex-none rounded-[6px] border border-dashed border-[#52525b]" />
                )}
                <span className="flex flex-col items-start gap-px">
                  <span>{v.name}</span>
                  <span className={cn("text-[11px]", on && !brand.logoUrl ? "text-[#fcd34d]" : "text-[#a8a8a8]")}>
                    {on ? (brand.logoUrl ? "uploaded" : "missing") : "Coming soon"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {!brand.logoUrl && (
        <p className={HINT}>
          Fans see your brand name until you add your logo on your{" "}
          <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
            Sponsor Profile
          </Link>
          .
        </p>
      )}

      <div className={NOTE}>
        <Info className="size-[18px] flex-none mt-px text-[#c7d2fe]" strokeWidth={1.8} aria-hidden="true" />
        <span>Simple BPA shows only your logo in this slot. Nothing else to set up. This is the default for every slot you buy.</span>
      </div>

      <div className="flex flex-wrap gap-[10px] border-t border-[#222] pt-[18px]">
        <Button
          label={`Save for ${orgName}`}
          disabled
          className={cn(
            PRIMARY_BUTTON,
            "h-[46px] px-5 rounded-[10px] text-[15px] font-semibold",
            "disabled:bg-[#27272a] disabled:text-[#71717a] disabled:opacity-100"
          )}
        />
        {orgCount > 1 && (
          <Button
            label={`Use this setup for all ${orgCount} organizations`}
            disabled
            className={cn(OUTLINE_BUTTON, "h-[46px] px-4 rounded-[10px] text-[15px] font-medium")}
          />
        )}
      </div>
    </section>
  );
}
