"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest, type SponsorApiResult } from "@/components/sponsor/sponsor-api";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import FanPreview from "@/components/sponsor/brand-placements/purchased-inventory/fan-preview";
import SlotEditor, { type LogoKind } from "@/components/sponsor/brand-placements/purchased-inventory/slot-editor";
import { routes } from "@/utils/routes";
import type { LogoVariant, SlotLogo, SlotLogoChoice } from "@/utils/types/sponsor-brand-assets";
import type { InventorySlot, SlotChip } from "@/utils/types/sponsor-inventory";

// A logo picked for one kind and not saved yet: `to` (an asset id, or null for the default), made while the
// slot showed `from`. It stops counting once the slot shows something else, e.g. after it was saved.
interface Pick {
  from: string | null;
  to: string | null;
}

// The logo this organization's slot has picked for a kind (here or for every organization); null = the default.
const chosen = (logo: SlotLogo) => (logo.source === "SLOT" || logo.source === "SLOT_TYPE" ? logo.assetId : null);

interface SlotSetupProps {
  orgName: string;
  // The picked slot.
  chip: SlotChip;
  // Its order lines at this organization (one per package or event); each takes the choice "for this org".
  lines: InventorySlot[];
  packageNames: string[];
  // Organizations with this slot, for "Use this setup for all N organizations".
  orgCount: number;
  logos: BrandLogos;
  brandName: string;
  // Loads the inventory again after a save.
  onSaved: () => void;
}

// One slot at one organization: the logo picker (saved for this organization or for all of them) and the fan
// preview, which follows the picks before they're saved. Keyed by organization and slot by the parent.
export default function SlotSetup({ orgName, chip, lines, packageNames, orgCount, logos, brandName, onSaved }: SlotSetupProps) {
  const [picks, setPicks] = useState<Partial<Record<LogoVariant, Pick>>>({});
  const [saving, setSaving] = useState<"org" | "all" | null>(null);

  const row = lines[0];
  const items = logos.list?.items ?? [];

  // The default of a kind: its default logo, else (full color) the profile logo.
  function fallback(variant: LogoVariant) {
    const status = logos.list?.variants.find((v) => v.variant === variant);
    const asset = items.find((a) => a.id === status?.defaultAssetId);
    if (asset) return { name: asset.name, url: asset.url };
    const profile = variant === "FULL_COLOR" ? (logos.list?.profileLogoUrl ?? null) : null;
    return { name: profile ? "Sponsor Profile logo" : null, url: profile };
  }

  const pickOf = (logo: SlotLogo) => {
    const p = picks[logo.variant];
    return p && p.from === chosen(logo) ? p.to : chosen(logo);
  };
  const changed = row ? row.logos.filter((l) => pickOf(l) !== chosen(l)) : [];
  // What all organizations show now differs from the picks, or this one has its own logo.
  const differsFromAll = row
    ? row.logos.some((l) => {
        const all = chip.logos.find((c) => c.variant === l.variant)?.slotTypeAssetId ?? null;
        return pickOf(l) !== all || l.slotAssetId !== null;
      })
    : false;

  const kinds: LogoKind[] = (row?.logos ?? []).map((l) => {
    const own = items.filter((a) => a.variant === l.variant);
    const def = fallback(l.variant);
    const picked = pickOf(l);
    return {
      variant: l.variant,
      label: l.variantLabel,
      usage: l.usage,
      picked,
      options: [
        { id: null, name: "Default", sub: def.name ?? "None yet", url: def.url },
        ...own.map((a) => ({ id: a.id, name: a.name, sub: a.isDefault ? "Your default" : a.source === "GENERATED" ? "Auto-made" : "", url: a.url })),
      ],
      // Nothing of this kind to show yet: fans see the brand name.
      missing: own.length === 0 && !def.url,
      overrides: chip.logos.find((c) => c.variant === l.variant)?.slotOverrides ?? 0,
      // What fans see with the picks: the saved logo until it changes.
      previewUrl: picked === chosen(l) ? l.url : picked ? (items.find((a) => a.id === picked)?.url ?? null) : def.url,
    };
  });

  function pick(variant: LogoVariant, to: string | null) {
    const logo = row?.logos.find((l) => l.variant === variant);
    if (logo) setPicks((prev) => ({ ...prev, [variant]: { from: chosen(logo), to } }));
  }

  async function finish(requests: Promise<SponsorApiResult<SlotLogoChoice>>[], done: string) {
    const results = await Promise.all(requests);
    setSaving(null);
    onSaved();
    const failed = results.find((r) => r.status < 200 || r.status >= 300);
    if (failed) toast.error(failed.message ?? "Something went wrong, please try again.");
    else toast.success(done);
  }

  // The picks on every line of this slot here. "Default" while all organizations share a logo pins the default
  // logo here (a removed choice would show the shared one); otherwise it removes this organization's choice.
  function saveForOrg() {
    setSaving("org");
    const requests = changed.flatMap((l) =>
      lines.map((line) => {
        const to = pickOf(l);
        const shared = line.logos.find((x) => x.variant === l.variant)?.slotTypeAssetId;
        const defaultId = logos.list?.variants.find((v) => v.variant === l.variant)?.defaultAssetId ?? null;
        const body = to ? { assetId: to } : shared && defaultId ? { assetId: defaultId } : { assetId: null, variant: l.variant };
        return sponsorRequest<SlotLogoChoice>("PUT", routes.api.sponsorInventoryLineLogo(line.lineId), { body });
      })
    );
    return finish(requests, `Logo saved for ${orgName}`);
  }

  // The picks for this slot at every organization (and slots of it bought later); this organization drops its
  // own choice so it matches. Other organizations with their own choice keep it.
  function useForAll() {
    setSaving("all");
    const requests = (row?.logos ?? []).flatMap((l) => {
      const to = pickOf(l);
      const body = to ? { catalogKey: chip.catalogKey, assetId: to } : { catalogKey: chip.catalogKey, assetId: null, variant: l.variant };
      const shared = sponsorRequest<SlotLogoChoice>("PUT", routes.api.sponsorInventoryLogos, { body });
      const own = lines
        .filter((line) => line.logos.some((x) => x.variant === l.variant && x.slotAssetId !== null))
        .map((line) =>
          sponsorRequest<SlotLogoChoice>("PUT", routes.api.sponsorInventoryLineLogo(line.lineId), {
            body: { assetId: null, variant: l.variant },
          })
        );
      return [shared, ...own];
    });
    return finish(requests, `Logo saved for all ${orgCount} organizations`);
  }

  const preview = kinds[0] ? { url: kinds[0].previewUrl, variant: kinds[0].variant } : null;

  return (
    <>
      <SlotEditor
        orgName={orgName}
        chip={chip}
        packageNames={packageNames}
        orgCount={orgCount}
        kinds={kinds}
        brandName={brandName}
        logos={logos}
        saving={saving}
        canSaveOrg={changed.length > 0}
        canUseAll={differsFromAll}
        onPick={pick}
        onSaveOrg={saveForOrg}
        onUseAll={useForAll}
      />
      <FanPreview chip={chip} orgName={orgName} logo={preview} brandName={brandName} />
    </>
  );
}
