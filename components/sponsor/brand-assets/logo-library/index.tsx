"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import HiddenFileInput from "@/components/common/hidden-file-input";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import Modal from "@/components/common/modal";
import LoadProblem from "@/components/sponsor/load-problem";
import LogoPreview from "@/components/sponsor/logo-preview";
import { logoAccept } from "@/components/sponsor/data";
import { CARD, HINT, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_TITLE } from "@/components/sponsor/styles";
import { useBrandLogos, type BrandLogos } from "@/components/sponsor/use-brand-logos";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import LogoCard from "@/components/sponsor/brand-assets/logo-library/logo-card";
import { logoNameSchema } from "@/components/sponsor/brand-assets/schema";
import type { BrandAsset, VariantSpec } from "@/utils/types/sponsor-brand-assets";

// The sponsor's logos by kind (full color, white, icon): several of each, one the default. The white logo and
// icon are made from the full-color default unless the sponsor uploads their own.
export default function LogoLibrary() {
  const logos = useBrandLogos();
  const account = useSponsorAccount();
  const brandName = account?.brandName || account?.displayName || "Your brand";
  const [renaming, setRenaming] = useState<BrandAsset | null>(null);
  const [deleting, setDeleting] = useState<BrandAsset | null>(null);

  function body() {
    if (logos.loading) return <Loader />;
    if (!logos.list || !logos.options) {
      return <LoadProblem message={`Couldn't load your logos: ${logos.error}`} onRetry={logos.retry} />;
    }
    return logos.options.variants.map((spec) => (
      <VariantGroup
        key={spec.variant}
        spec={spec}
        logos={logos}
        brandName={brandName}
        onRename={setRenaming}
        onDelete={setDeleting}
      />
    ));
  }

  const summary = logos.list?.summary;

  return (
    <section aria-labelledby="logo-library-title" className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="logo-library-title" className={SECTION_TITLE}>
          Logos
        </h3>
        {summary && (
          <span className={cn("text-[13px]", summary.missing ? "text-[#fcd34d]" : "text-[#86efac]")}>
            {summary.missing
              ? `${summary.ready} of ${summary.total} in use · ${summary.missing} missing for your slots`
              : `${summary.ready} of ${summary.total} in use · every slot covered`}
          </span>
        )}
      </div>
      <p className="max-w-[820px] text-sm leading-normal text-[#a8a8a8]">
        Upload your full-color logo and we make the white logo and icon from it. Upload your own white logo or icon to
        replace the made one. The default of each kind shows on every slot that calls for it, unless you pick another
        logo for a slot on Brand Placements.
      </p>
      {body()}

      {renaming && logos.options && (
        <RenameModal asset={renaming} max={logos.options.limits.nameMax} logos={logos} onClose={() => setRenaming(null)} />
      )}

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete logo"
        message={deleteMessage(deleting)}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        destructive
        onConfirm={() => (deleting ? logos.remove(deleting) : Promise.resolve(true))}
      />
    </section>
  );
}

// What deleting a logo does to the slots that show it.
function deleteMessage(asset: BrandAsset | null) {
  if (!asset) return "";
  const picked = asset.usedBy.slotTypes + asset.usedBy.slots;
  const parts = [`Delete “${asset.name}”?`];
  if (picked) parts.push("Slots that picked it go back to your default logo.");
  if (asset.isDefault) parts.push("Your newest other logo of this kind becomes the default.");
  return parts.join(" ");
}

interface VariantGroupProps {
  spec: VariantSpec;
  logos: BrandLogos;
  brandName: string;
  onRename: (asset: BrandAsset) => void;
  onDelete: (asset: BrandAsset) => void;
}

// One kind: its rules, what it's used on, Add logo, and its logos (the default first).
function VariantGroup({ spec, logos, brandName, onRename, onDelete }: VariantGroupProps) {
  const addRef = useRef<HTMLInputElement>(null);
  const list = logos.list;
  const status = list?.variants.find((v) => v.variant === spec.variant);
  const items = (list?.items ?? [])
    .filter((a) => a.variant === spec.variant)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const max = logos.options?.limits.perVariantMax ?? 10;
  // Made logos don't count toward the limit.
  const full = (status?.uploaded ?? 0) >= max;
  const adding = logos.busy === `upload:${spec.variant}`;
  const accept = logoAccept(spec);
  const fromProfile = status?.inUse.source === "PROFILE";

  return (
    <div className={cn(CARD, "rounded-[14px] p-[18px] flex flex-col gap-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 max-w-[720px]">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="text-lg font-bold">{spec.label}</h4>
            <span className="text-[13px] text-[#a8a8a8]">
              {status?.uploaded ?? 0} / {max} uploaded
            </span>
          </div>
          <span className="text-[13px] text-[#d4d4d8]">{spec.description}</span>
          <span className={HINT}>
            {spec.formats.join(", ")} · at least {spec.minWidth}×{spec.minHeight} px · recommended {spec.recommended.width}×
            {spec.recommended.height} px · used on {spec.usedOn.join(", ")}
          </span>
        </div>
        <Button
          label={adding ? "Uploading…" : "Add logo"}
          icon={<Upload className="size-[15px]" strokeWidth={2} />}
          aria-label={`Add ${spec.label.toLowerCase()}`}
          title={full ? `You can keep up to ${max} logos of this kind` : undefined}
          disabled={adding || full}
          onClick={() => addRef.current?.click()}
          className={cn(items.length ? OUTLINE_BUTTON : PRIMARY_BUTTON, "h-10 px-[14px] gap-1.5 rounded-[8px] text-[13px] font-semibold")}
        />
        <HiddenFileInput ref={addRef} accept={accept} onFiles={(files) => logos.upload(spec.variant, files[0])} />
      </div>

      {status?.needsUpload && <p className="text-[13px] leading-normal text-[#fcd34d]">{status.needsUpload}</p>}

      {items.length === 0 && !fromProfile ? (
        <p className="text-sm text-[#a8a8a8]">
          {status?.state === "MISSING"
            ? `None yet, and ${status.neededBySlots} of your slots need one. Fans see your brand name there until you add one.`
            : "None yet."}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
          {fromProfile && items.length === 0 && (
            <ProfileLogoCard url={status?.inUse.url ?? null} brandName={brandName} />
          )}
          {items.map((asset) => (
            <LogoCard
              key={asset.id}
              asset={asset}
              brandName={brandName}
              busy={logos.busy === asset.id}
              accept={accept}
              onReplace={(file) => logos.replace(asset, file)}
              onMakeDefault={() => logos.makeDefault(asset)}
              onRename={() => onRename(asset)}
              onRegenerate={asset.variant === "FULL_COLOR" ? () => logos.regenerate(asset) : undefined}
              onDelete={() => onDelete(asset)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// The sign-up logo, which slots show until a full-color logo is uploaded here (no white logo or icon is made
// from it).
function ProfileLogoCard({ url, brandName }: { url: string | null; brandName: string }) {
  return (
    <article className="bg-[#141414] border border-[#222] rounded-[8px] overflow-hidden flex flex-col">
      <LogoPreview
        url={url}
        variant="FULL_COLOR"
        brandName={brandName}
        alt="Sponsor Profile logo"
        className="h-[120px] rounded-none border-0 border-b border-[#222] text-[26px]"
        imageClassName="p-4"
      />
      <div className="p-4 flex flex-col gap-2">
        <h4 className="text-base font-bold">From your Sponsor Profile</h4>
        <p className="text-[13px] leading-normal text-[#a8a8a8]">
          Your slots show this until you add a full-color logo here. Adding one also makes your white logo and icon.
        </p>
      </div>
    </article>
  );
}

interface RenameModalProps {
  asset: BrandAsset;
  // The API's name limit.
  max: number;
  logos: BrandLogos;
  onClose: () => void;
}

// A new name for a logo (how it shows in the slot picker).
function RenameModal({ asset, max, logos, onClose }: RenameModalProps) {
  const [name, setName] = useState(asset.name);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const saving = logos.busy === asset.id;

  async function save() {
    if (!(await validateAndSetErrors(logoNameSchema(max), { name }, setErrors))) return;
    if (name.trim() === asset.name) return onClose();
    if (await logos.rename(asset, name.trim())) onClose();
  }

  return (
    <Modal isOpen onClose={onClose} title="Rename logo">
      <div className="w-full flex flex-col gap-6">
        <Input
          label="Name"
          name="logo-name"
          value={name}
          maxLength={max}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name}
          labelClassName="text-midnight-navy"
        />
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
          <Button label={saving ? "Saving…" : "Save"} variant="cta" disabled={saving} onClick={save} fullWidth />
        </div>
      </div>
    </Modal>
  );
}
