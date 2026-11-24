"use client";

import { useRef, useState, type RefObject } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import SegmentedControl from "@/components/common/segmented-control";
import HiddenFileInput from "@/components/common/hidden-file-input";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import Modal from "@/components/common/modal";
import LoadProblem from "@/components/sponsor/load-problem";
import LogoPreview from "@/components/sponsor/logo-preview";
import { isSquareLogo, logoAccept } from "@/components/sponsor/data";
import { OUTLINE_BUTTON, SECTION_TITLE } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import AssetDropzone from "@/components/sponsor/brand-assets/asset-dropzone";
import LogoCard from "@/components/sponsor/brand-assets/logo-library/logo-card";
import MainLogoChoice from "@/components/sponsor/brand-assets/main-logo-choice";
import { logoNameSchema } from "@/components/sponsor/brand-assets/schema";
import type { BrandAsset, LogoVariant, VariantSpec, VariantStatus } from "@/utils/types/sponsor-brand-assets";

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

// The two main kinds the drop zone takes: the landscape and the circular logo.
const DROP_KINDS: LogoVariant[] = ["FULL_COLOR", "CIRCULAR"];

// The Brand Assets library: the main logo, the drop zone (a landscape or a circular logo) and every logo in one
// grid. While the landscape logo is the main logo the backend makes the white logo and icon from it; the sponsor
// swaps in their own with Replace on those, or uploads them while the circular logo is the main logo.
export default function LogoLibrary({ logos, inputRef }: LogoLibraryProps) {
  const account = useSponsorAccount();
  const brandName = account?.brandName || account?.displayName || "Your brand";
  const [renaming, setRenaming] = useState<BrandAsset | null>(null);
  const [deleting, setDeleting] = useState<BrandAsset | null>(null);
  // The kind the drop zone uploads; the main logo's kind until the sponsor picks.
  const [picked, setPicked] = useState<LogoVariant | null>(null);

  const landscapeMain = logos.mainLogo === "LANDSCAPE";
  const dropKinds = DROP_KINDS.flatMap((variant) => logos.specOf(variant) ?? []);
  const dropKind = picked ?? (landscapeMain ? "FULL_COLOR" : "CIRCULAR");
  const dropSpec = logos.specOf(dropKind);
  const maxBytes = logos.options?.limits.maxBytes;
  const formats = dropSpec ? `${dropSpec.formats.join(", ")}${maxBytes ? ` up to ${toMB(maxBytes)} MB` : ""}` : "";
  const uploading = logos.busy?.startsWith("upload:") ?? false;
  const summary = logos.list?.summary;

  // One after another, so each gets its own check and message.
  async function uploadAll(files: File[]) {
    for (const file of files) await logos.upload(dropKind, file);
  }

  function body() {
    if (logos.loading) return <Loader />;
    if (!logos.list || !logos.options) {
      return <LoadProblem message={`Couldn't load your logos: ${logos.error}`} onRetry={logos.retry} />;
    }
    const { items, variants } = logos.list;
    const hasFullColor = items.some((a) => a.variant === "FULL_COLOR");
    // Something to make the white logo and icon from, or nothing is made (the sponsor uploads them).
    const versionsExpected = hasFullColor || !landscapeMain;

    const cards = logos.options.variants.flatMap((spec) => {
      const status = variants.find((v) => v.variant === spec.variant);
      const ofKind = items
        .filter((a) => a.variant === spec.variant)
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

      if (ofKind.length === 0) {
        if (spec.variant === "FULL_COLOR" && status?.inUse.source === "PROFILE") {
          return [<ProfileLogoCard key="profile" url={status.inUse.url} brandName={brandName} />];
        }
        if (!status) return [];
        // Offered once the library has logos: Partner Offers shows it, and the main logo can only be circular once
        // there's one. An empty library says how to start instead.
        if (spec.variant === "CIRCULAR") {
          if (items.length === 0) return [];
          return [<MissingLogoCard key={spec.variant} spec={spec} status={status} logos={logos} brandName={brandName} />];
        }
        // A white logo or icon that couldn't be made, isn't made (circular main logo) or that slots need: upload one
        // here. Before any landscape logo there's nothing to make them from, so the drop zone covers it. With a
        // circular logo the icon isn't shown anywhere, so it isn't asked for.
        const iconUnused = spec.variant === "ICON" && status.state === "NOT_NEEDED" && !landscapeMain;
        if (spec.variant !== "FULL_COLOR" && versionsExpected && !iconUnused && (status.needsUpload || status.state === "MISSING")) {
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
          onRegenerate={asset.variant === "FULL_COLOR" && logos.canRegenerate ? () => logos.regenerate(asset) : undefined}
          showVersions={logos.canRegenerate}
          onDelete={() => setDeleting(asset)}
        />
      ));
    });

    if (cards.length === 0) {
      return (
        <p className="text-base text-[#a8a8a8]">
          No logos yet. Drop your landscape logo above and we&apos;ll make the white logo and icon from it, or switch to
          Circular logo to add your round mark.
        </p>
      );
    }
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">{cards}</div>;
  }

  return (
    <section aria-label="Library" className="flex-[2_1_520px] min-w-0 flex flex-col gap-[18px]">
      <MainLogoChoice logos={logos} />
      {dropKinds.length > 1 && (
        <SegmentedControl
          ariaLabel="Upload as"
          options={dropKinds.map((s) => s.label)}
          active={dropSpec?.label ?? dropKinds[0].label}
          onChange={(label) => setPicked(dropKinds.find((s) => s.label === label)?.variant ?? null)}
          variant="light"
        />
      )}
      <AssetDropzone
        inputRef={inputRef}
        accept={dropSpec ? logoAccept(dropSpec) : FALLBACK_ACCEPT}
        hint={dropHint(dropKind, formats, landscapeMain)}
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

// Under the drop zone: the formats, and what happens after (versions made from a landscape main logo).
function dropHint(kind: LogoVariant, formats: string, landscapeMain: boolean) {
  const what =
    kind === "CIRCULAR"
      ? "a round mark on a square file, shown in a circle on Partner Offers"
      : landscapeMain
        ? "we make the white logo and icon from it"
        : "nothing is made from it while your main logo is circular";
  return [formats, what].filter(Boolean).join(" · ");
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

// The sign-up logo, which slots show until a landscape logo is uploaded here (no white logo or icon is made
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
          Your slots show this until you add a landscape logo here. Adding one also makes your white logo and icon.
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

// A kind with no logo of the sponsor's own: a white logo or icon that couldn't be made from the landscape logo,
// isn't made (circular main logo) or that slots need, or the circular logo (shown with the icon fans see meanwhile).
// Why, its rules, and an upload of the sponsor's own.
function MissingLogoCard({ spec, status, logos, brandName }: MissingLogoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = spec.label.toLowerCase();
  const uploading = logos.busy === `upload:${spec.variant}`;
  // The circular kind shows the default icon until one is uploaded.
  const fallback = spec.variant === "CIRCULAR" && !status.defaultAssetId ? status.inUse.url : null;
  const missing = status.state === "MISSING" || Boolean(status.needsUpload);
  const text =
    status.needsUpload ??
    (fallback
      ? "Partner Offers shows your icon until you add one."
      : status.state === "MISSING"
        ? `None yet, and ${status.neededBySlots} of your slots need one. Fans see your brand name there until you add one.`
        : spec.description);

  return (
    <article className={CARD_SHELL}>
      <LogoPreview
        url={fallback}
        variant={spec.variant}
        brandName={brandName}
        alt={fallback ? "Your icon, shown until you add a circular logo" : ""}
        className={cn(PREVIEW, isSquareLogo(spec.variant) ? "text-[34px]" : "text-[26px]")}
        imageClassName="p-4"
      />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between gap-2 items-start">
          <h4 className="min-w-0 break-words text-base font-bold">{spec.label}</h4>
          <span
            className={cn(
              "text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap",
              missing ? "bg-[#3d2a12] text-[#ffc999]" : "bg-[#1e222a] text-[#d4d4d8]"
            )}
          >
            {missing ? "Missing" : "Not added"}
          </span>
        </div>
        <p className={cn("text-[13px] leading-normal", missing ? "text-[#fcd34d]" : "text-[#a8a8a8]")}>{text}</p>
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
