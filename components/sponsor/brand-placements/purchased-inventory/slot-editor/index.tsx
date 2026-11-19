"use client";

import { useRef } from "react";
import Link from "next/link";
import { Info, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import LogoPreview from "@/components/sponsor/logo-preview";
import { logoAccept } from "@/components/sponsor/data";
import { CARD, HINT, HINT_LINK, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import { TEMPLATES } from "@/components/sponsor/brand-placements/purchased-inventory/data";
import { routes } from "@/utils/routes";
import type { LogoVariant } from "@/utils/types/sponsor-brand-assets";
import type { SlotChip } from "@/utils/types/sponsor-inventory";

const LEGEND = "text-xs font-semibold tracking-[1.2px] text-[#e4e4e7] pb-[10px]";
const OPTION = "border text-left text-white disabled:cursor-not-allowed";
const OPTION_ON = "bg-[#2a2148] border-[#8b6dff]";
const OPTION_OFF = "bg-[#0b0b0b] border-[#333]";
const NOTE = "flex items-start gap-[10px] rounded-[10px] border border-[#333] bg-[#0b0b0b] px-[14px] py-3 text-[13px] leading-normal text-[#d4d4d8]";
const SOON = "text-[10px] font-bold tracking-[1px] px-2 py-0.5 rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]";

// One logo kind the slot's screen shows, with the logos the sponsor can pick for it.
export interface LogoKind {
  variant: LogoVariant;
  label: string;
  // Where it shows ("Prediction card header").
  usage: string;
  // The picked logo's id; null = the default of the kind.
  picked: string | null;
  // The sponsor's logos of this kind, one card each. The default comes first with id null: picking it follows the
  // default, so the slot changes with it; any other logo is pinned to the slot.
  options: { id: string | null; name: string; sub: string; url: string | null }[];
  // No logo of this kind at all: fans see the brand name.
  missing: boolean;
  // Organizations where this slot has its own logo of this kind.
  overrides: number;
  previewUrl: string | null;
}

interface SlotEditorProps {
  orgName: string;
  chip: SlotChip;
  // The packages the shown slots come from at this organization.
  packageNames: string[];
  // Organizations in the list, for "Use this setup for all N organizations".
  orgCount: number;
  kinds: LogoKind[];
  brandName: string;
  logos: BrandLogos;
  saving: "org" | "all" | null;
  canSaveOrg: boolean;
  canUseAll: boolean;
  onPick: (variant: LogoVariant, id: string | null) => void;
  onSaveOrg: () => void;
  onUseAll: () => void;
}

// How the sponsor shows up on a slot: the logo for each kind its screen shows (live), saved for this
// organization or all of them. Templates aren't in the API yet: Simple BPA, shown disabled.
export default function SlotEditor({
  orgName,
  chip,
  packageNames,
  orgCount,
  kinds,
  brandName,
  logos,
  saving,
  canSaveOrg,
  canUseAll,
  onPick,
  onSaveOrg,
  onUseAll,
}: SlotEditorProps) {
  const eyebrow = [chip.categoryLabel, chip.name, packageNames.join(" / ")].filter(Boolean).join(" · ");

  return (
    <section
      aria-labelledby="slot-editor-title"
      className={cn(CARD, "flex-[3_1_360px] min-w-0 rounded-[14px] p-[22px] flex flex-col gap-5")}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold tracking-[1px] text-[#a8a8a8]">{eyebrow.toUpperCase()}</span>
        <h4 id="slot-editor-title" className="font-display font-black text-2xl leading-tight">
          {orgName}
        </h4>
      </div>

      {/* A disabled fieldset disables every option inside it. */}
      <fieldset disabled className="flex flex-col">
        <legend className={cn(LEGEND, "flex items-center gap-2")}>
          TEMPLATE <span className={SOON}>COMING SOON</span>
        </legend>
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
                className={cn(OPTION, "flex flex-col items-start gap-1.5 p-[14px] rounded-[12px]", on ? OPTION_ON : cn(OPTION_OFF, "opacity-60"))}
              >
                <t.icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="text-xs leading-[1.4] text-[#a8a8a8]">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {kinds.map((kind) => (
        <LogoPicker key={kind.variant} kind={kind} brandName={brandName} logos={logos} disabled={saving !== null} onPick={onPick} />
      ))}

      <div className={NOTE}>
        <Info className="size-[18px] flex-none mt-px text-[#c7d2fe]" strokeWidth={1.8} aria-hidden="true" />
        <span>
          Simple BPA shows only your logo in this slot. &ldquo;Your default&rdquo; follows the default logo on{" "}
          <Link href={routes.ui.sponsor.brandAssets} className={HINT_LINK}>
            Brand Assets
          </Link>
          , so this slot changes when your default does. Pick another logo to keep it here.
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#222] pt-[18px]">
        <div className="flex flex-wrap gap-[10px]">
          <Button
            label={saving === "org" ? "Saving…" : `Save for ${orgName}`}
            disabled={!canSaveOrg || saving !== null}
            onClick={onSaveOrg}
            className={cn(
              PRIMARY_BUTTON,
              "h-[46px] px-5 rounded-[10px] text-[15px] font-semibold",
              "disabled:bg-[#27272a] disabled:text-[#71717a] disabled:opacity-100"
            )}
          />
          {orgCount > 1 && (
            <Button
              label={saving === "all" ? "Saving…" : `Use this setup for all ${orgCount} organizations`}
              disabled={!canUseAll || saving !== null}
              onClick={onUseAll}
              className={cn(OUTLINE_BUTTON, "h-[46px] px-4 rounded-[10px] text-[15px] font-medium")}
            />
          )}
        </div>
        {kinds.map(
          (kind) =>
            kind.overrides > 0 && (
              <p key={kind.variant} className={HINT}>
                {kind.overrides} organization{kind.overrides === 1 ? " uses" : "s use"} a different {kind.label.toLowerCase()} on
                this slot.
              </p>
            )
        )}
      </div>
    </section>
  );
}

interface LogoPickerProps {
  kind: LogoKind;
  brandName: string;
  logos: BrandLogos;
  disabled: boolean;
  onPick: (variant: LogoVariant, id: string | null) => void;
}

// The logos of one kind as radio cards, or an Upload when there's none of that kind yet.
function LogoPicker({ kind, brandName, logos, disabled, onPick }: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const spec = logos.specOf(kind.variant);
  const uploading = logos.busy === `upload:${kind.variant}`;

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-[10px] min-w-0">
      <legend className={LEGEND}>LOGO ON THIS SCREEN · {kind.label.toUpperCase()}</legend>
      <span className={cn(HINT, "-mt-1")}>
        {`${kind.usage} · this screen uses your ${kind.label.toLowerCase()} only, so other logo types aren't listed`}
      </span>

      {kind.missing ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#854d0e] bg-[#2b1d05] px-[14px] py-3">
          <span className="flex-1 min-w-[200px] text-[13px] text-[#fcd34d]">
            Upload your {kind.label.toLowerCase()} first. Fans see your brand name here until you do.
          </span>
          <Button
            label={uploading ? "Uploading…" : "Upload"}
            icon={<Upload className="size-[15px]" strokeWidth={2} />}
            aria-label={`Upload ${kind.label.toLowerCase()}`}
            disabled={uploading || !spec}
            onClick={() => inputRef.current?.click()}
            className={cn(PRIMARY_BUTTON, "h-10 px-[14px] gap-1.5 rounded-[8px] text-[13px] font-semibold")}
          />
          {spec && (
            <HiddenFileInput
              ref={inputRef}
              accept={logoAccept(spec)}
              onFiles={(files) => logos.upload(kind.variant, files[0], { isDefault: true })}
            />
          )}
        </div>
      ) : (
        <div role="radiogroup" aria-label={kind.label} className="flex flex-wrap gap-2">
          {kind.options.map((option) => {
            const on = option.id === kind.picked;
            return (
              // An option card (logo swatch, name, note), not an action button.
              <button
                key={option.id ?? "default"}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(kind.variant, option.id)}
                className={cn(
                  OPTION,
                  "flex items-center gap-[10px] min-h-12 max-w-full px-3 py-1.5 rounded-[10px] text-[13px] transition-colors",
                  on ? OPTION_ON : cn(OPTION_OFF, "hover:border-[#52525b]")
                )}
              >
                <LogoPreview
                  url={option.url}
                  variant={kind.variant}
                  brandName={brandName}
                  className="h-[26px] w-[34px] rounded-[6px] text-[11px]"
                  imageClassName="p-0.5"
                />
                <span className="flex flex-col items-start gap-px min-w-0">
                  <span className="truncate max-w-[180px]">{option.name}</span>
                  {option.sub && <span className="text-[11px] text-[#a8a8a8] truncate max-w-[180px]">{option.sub}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
