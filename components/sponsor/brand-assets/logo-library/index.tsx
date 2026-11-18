"use client";

import { useRef, useState, type RefObject } from "react";
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
import { OUTLINE_BUTTON, SECTION_TITLE } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import AssetDropzone from "@/components/sponsor/brand-assets/asset-dropzone";
import LogoCard from "@/components/sponsor/brand-assets/logo-library/logo-card";
import { logoNameSchema } from "@/components/sponsor/brand-assets/schema";
import type { BrandAsset, VariantSpec, VariantStatus } from "@/utils/types/sponsor-brand-assets";

// The picker filter until the rules from GET /brand-assets/options arrive.
const FALLBACK_ACCEPT = ".svg,.png,.jpg,.jpeg";

// The card look shared by the logo, profile and missing cards.
const CARD_SHELL = "bg-[#141414] border border-[#222] rounded-[8px] overflow-hidden flex flex-col";
const PREVIEW = "h-[120px] rounded-none border-0 border-b border-[#222]";

interface LogoLibraryProps {
  logos: BrandLogos;
  // The drop zone's file input; the page's "Upload assets" button opens it too.
  inputRef: RefObject<HTMLInputElement | null>;
}

// The Brand Assets library: the drop zone and every logo in one grid. Each upload is a full-color logo, and
// the backend makes the white logo and icon from it; the sponsor swaps in their own with Replace on those.
export default function LogoLibrary({ logos, inputRef }: LogoLibraryProps) {
  const account = useSponsorAccount();
  const brandName = account?.brandName || account?.displayName || "Your brand";
  const [renaming, setRenaming] = useState<BrandAsset | null>(null);
  const [deleting, setDeleting] = useState<BrandAsset | null>(null);

  const fullColor = logos.specOf("FULL_COLOR");
  const maxBytes = logos.options?.limits.maxBytes;
  const formats = fullColor ? `${fullColor.formats.join(", ")}${maxBytes ? ` up to ${toMB(maxBytes)} MB` : ""} · ` : "";
  const uploading = logos.busy?.startsWith("upload:") ?? false;
  const summary = logos.list?.summary;

  // One after another, so each gets its own check and message.
  async function uploadAll(files: File[]) {
    for (const file of files) await logos.upload("FULL_COLOR", file);
  }

  function body() {
    if (logos.loading) return <Loader />;
    if (!logos.list || !logos.options) {
      return <LoadProblem message={`Couldn't load your logos: ${logos.error}`} onRetry={logos.retry} />;
    }
    const { items, variants } = logos.list;
    const hasFullColor = items.some((a) => a.variant === "FULL_COLOR");

    const cards = logos.options.variants.flatMap((spec) => {
      const status = variants.find((v) => v.variant === spec.variant);
      const ofKind = items
        .filter((a) => a.variant === spec.variant)
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

      if (ofKind.length === 0) {
        if (spec.variant === "FULL_COLOR" && status?.inUse.source === "PROFILE") {
          return [<ProfileLogoCard key="profile" url={status.inUse.url} brandName={brandName} />];
        }
        // A white logo or icon that couldn't be made, or that slots need: upload one here. Before any
        // full-color logo there's nothing to make them from, so the drop zone covers it.
        if (spec.variant !== "FULL_COLOR" && hasFullColor && status && (status.needsUpload || status.state === "MISSING")) {
          return [<MissingLogoCard key={spec.variant} spec={spec} status={status} logos={logos} brandName={brandName} />];
        }
        return [];
      }

      return ofKind.map((asset) => (
        <LogoCard
          key={asset.id}
          asset={asset}
          brandName={brandName}
          busy={logos.busy === asset.id}
          accept={logoAccept(spec)}
          onReplace={(file) => logos.replace(asset, file)}
          onMakeDefault={() => logos.makeDefault(asset)}
          onRename={() => setRenaming(asset)}
          onRegenerate={asset.variant === "FULL_COLOR" ? () => logos.regenerate(asset) : undefined}
          onDelete={() => setDeleting(asset)}
        />
      ));
    });

    if (cards.length === 0) {
      return (
        <p className="text-base text-[#a8a8a8]">
          No logos yet. Drop your full-color logo above and we&apos;ll make the white logo and icon from it.
        </p>
      );
    }
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">{cards}</div>;
  }

  return (
    <section aria-label="Library" className="flex-[2_1_520px] min-w-0 flex flex-col gap-[18px]">
      <AssetDropzone
        inputRef={inputRef}
        accept={fullColor ? logoAccept(fullColor) : FALLBACK_ACCEPT}
        hint={`${formats}we make the white logo and icon from it`}
        busy={uploading}
        onFiles={uploadAll}
      />
      <div className="flex flex-wrap gap-3 items-baseline justify-between">
        <h3 className={SECTION_TITLE}>Library</h3>
        {summary && (
          <span className={cn("text-[13px]", summary.missing ? "text-[#fcd34d]" : "text-[#86efac]")}>
            {summary.missing
              ? `${summary.ready} of ${summary.total} in use · ${summary.missing} missing for your slots`
              : `${summary.ready} of ${summary.total} in use · every slot covered`}
          </span>
        )}
      </div>
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

// "2" for 2 MB.
const toMB = (bytes: number) => Number((bytes / (1024 * 1024)).toFixed(1));

// What deleting a logo does to the slots that show it.
function deleteMessage(asset: BrandAsset | null) {
  if (!asset) return "";
  const picked = asset.usedBy.slotTypes + asset.usedBy.slots;
  const parts = [`Delete “${asset.name}”?`];
  if (picked) parts.push("Slots that picked it go back to your default logo.");
  if (asset.isDefault) parts.push("Your newest other logo of this kind becomes the default.");
  return parts.join(" ");
}

// The sign-up logo, which slots show until a full-color logo is uploaded here (no white logo or icon is made
// from it).
function ProfileLogoCard({ url, brandName }: { url: string | null; brandName: string }) {
  return (
    <article className={CARD_SHELL}>
      <LogoPreview
        url={url}
        variant="FULL_COLOR"
        brandName={brandName}
        alt="Sponsor Profile logo"
        className={cn(PREVIEW, "text-[26px]")}
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

interface MissingLogoCardProps {
  spec: VariantSpec;
  status: VariantStatus;
  logos: BrandLogos;
  brandName: string;
}

// A white logo or icon that couldn't be made from the full-color logo (or that slots need and there's none):
// why, its rules, and an upload of the sponsor's own.
function MissingLogoCard({ spec, status, logos, brandName }: MissingLogoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = spec.label.toLowerCase();
  const uploading = logos.busy === `upload:${spec.variant}`;

  return (
    <article className={CARD_SHELL}>
      <LogoPreview
        url={null}
        variant={spec.variant}
        brandName={brandName}
        className={cn(PREVIEW, spec.variant === "ICON" ? "text-[34px]" : "text-[26px]")}
      />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between gap-2 items-start">
          <h4 className="min-w-0 break-words text-base font-bold">{spec.label}</h4>
          <span className="text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap bg-[#3d2a12] text-[#ffc999]">
            Missing
          </span>
        </div>
        <p className="text-[13px] leading-normal text-[#fcd34d]">
          {status.needsUpload ??
            `None yet, and ${status.neededBySlots} of your slots need one. Fans see your brand name there until you add one.`}
        </p>
        <div className="text-[13px] text-[#a8a8a8]">
          {spec.formats.join(", ")} · at least {spec.minWidth}×{spec.minHeight} px
        </div>
        <div className="mt-auto pt-[6px]">
          <Button
            label={uploading ? "Uploading…" : `Upload ${label}`}
            icon={<Upload className="size-[15px]" strokeWidth={2} />}
            disabled={logos.busy?.startsWith("upload:") ?? false}
            onClick={() => inputRef.current?.click()}
            fullWidth
            className={cn(OUTLINE_BUTTON, "h-11 px-3 gap-1.5 rounded-[10px] text-sm font-semibold")}
          />
          <HiddenFileInput ref={inputRef} accept={logoAccept(spec)} onFiles={(files) => logos.upload(spec.variant, files[0])} />
        </div>
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
