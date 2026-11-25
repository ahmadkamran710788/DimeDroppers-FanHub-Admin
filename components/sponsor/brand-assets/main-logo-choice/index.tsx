"use client";

import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import HiddenFileInput from "@/components/common/hidden-file-input";
import LogoPreview from "@/components/sponsor/logo-preview";
import { logoAccept } from "@/components/sponsor/data";
import { HINT, OUTLINE_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import type { BrandAssetList, LogoVariant, MainLogo, MainLogoOption } from "@/utils/types/sponsor-brand-assets";

// The kind of logo each main logo is.
const KIND: Record<MainLogo, LogoVariant> = { LANDSCAPE: "FULL_COLOR", CIRCULAR: "CIRCULAR" };

const CARD_BUTTON = cn(OUTLINE_BUTTON, "self-start h-10 px-[14px] gap-1.5 rounded-[8px] text-[13px] font-semibold");

interface MainLogoChoiceProps {
  logos: BrandLogos;
  brandName: string;
}

// The sponsor's main logo (PUT /brand-assets/main-logo): the one screens show where there's room for one logo, and
// what the made versions follow. Landscape makes the white logo and icon from the default landscape logo; Circular
// makes nothing. One card per choice, with that kind's default logo: the main one is marked "Main logo", the other
// has "Make main logo" (or, with no circular logo yet, an upload). Switching to circular asks first, since the made
// versions are removed.
export default function MainLogoChoice({ logos, brandName }: MainLogoChoiceProps) {
  const [confirming, setConfirming] = useState(false);
  const { list, options, mainLogo } = logos;
  if (!list || !options || options.mainLogos.length === 0) return null;

  function choose(value: MainLogo) {
    if (value === "CIRCULAR") setConfirming(true);
    else logos.setMainLogo(value);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex flex-col gap-1">
        <div id="main-logo-label" className={SECTION_LABEL}>
          MAIN LOGO
        </div>
        <p className={HINT}>
          Your main logo is the one shown where there&apos;s room for just one, like the “Presented by” banner on a Game
          Thread. It also decides which versions we make for you.
        </p>
      </div>
      <div role="group" aria-labelledby="main-logo-label" className="grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-3">
        {options.mainLogos.map((option) => (
          <MainLogoCard
            key={option.value}
            option={option}
            main={option.value === mainLogo}
            logos={logos}
            list={list}
            brandName={brandName}
            onChoose={() => choose(option.value)}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Make the circular logo your main logo"
        message={circularMessage(list)}
        confirmLabel="Make it main"
        busyLabel="Saving…"
        onConfirm={() => logos.setMainLogo("CIRCULAR")}
      />
    </div>
  );
}

interface MainLogoCardProps {
  option: MainLogoOption;
  // This is the sponsor's main logo now.
  main: boolean;
  logos: BrandLogos;
  list: BrandAssetList;
  brandName: string;
  onChoose: () => void;
}

// One choice: that kind's default logo, its name and what it means for the versions, and either the "Main logo"
// mark or the way to make it main.
function MainLogoCard({ option, main, logos, list, brandName, onChoose }: MainLogoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const variant = KIND[option.value];
  const spec = logos.specOf(variant);
  const status = list.variants.find((v) => v.variant === variant);
  const round = variant === "CIRCULAR";
  // A circular logo only once one's uploaded (the kind otherwise shows the icon); the landscape one can be the
  // Sponsor Profile logo.
  const url = round && !status?.defaultAssetId ? null : (status?.inUse.url ?? null);
  // Only a circular logo can be made main without one of its kind.
  const needsUpload = round && !list.items.some((a) => a.variant === "CIRCULAR");
  const label = option.label.toLowerCase();
  const saving = logos.busy === "main-logo";
  const uploading = logos.busy === `upload:${variant}`;
  const waiting = saving || (logos.busy?.startsWith("upload:") ?? false);

  return (
    <article
      className={cn(
        "flex flex-col gap-3 p-[14px] rounded-[12px] border text-white transition-colors",
        main ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#0b0b0b] border-[#333]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <LogoPreview
          url={url}
          variant={variant}
          brandName={brandName}
          alt={`Your ${label}`}
          className={round ? "size-16 rounded-full text-[24px]" : "h-16 w-[180px] max-w-full rounded-[8px] text-[18px]"}
          imageClassName={round ? "p-0" : "p-2"}
        />
        {main && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap bg-[#2a2148] text-[#d9ccff]">
            <Check className="size-3.5" strokeWidth={3} />
            Main logo
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-[17px] font-bold leading-tight">{option.label}</h4>
        <p className="text-sm text-[#bdbdbd] leading-[1.45]">{option.description}</p>
      </div>

      {!main && (
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {needsUpload ? (
            <>
              <p className={HINT}>Upload a {label} first to make it your main logo.</p>
              <Button
                label={uploading ? "Uploading…" : `Upload ${label}`}
                icon={<Upload className="size-[15px]" strokeWidth={2} />}
                disabled={waiting || !spec}
                onClick={() => inputRef.current?.click()}
                className={CARD_BUTTON}
              />
              {spec && (
                <HiddenFileInput ref={inputRef} accept={logoAccept(spec)} onFiles={(files) => logos.upload(variant, files[0])} />
              )}
            </>
          ) : (
            <Button
              label={saving ? "Saving…" : "Make main logo"}
              aria-label={`Make your ${label} your main logo`}
              disabled={waiting}
              onClick={onChoose}
              className={CARD_BUTTON}
            />
          )}
        </div>
      )}
    </article>
  );
}

// What switching to the circular logo does: nothing is made any more, the made white logo and icon go, and the
// slots that picked them go back to the next logo.
function circularMessage(list: BrandAssetList) {
  const made = list.items.filter((a) => a.source === "GENERATED");
  const picked = made.reduce((n, a) => n + a.usedBy.slotTypes + a.usedBy.slots, 0);
  const parts = ["Nothing is made from it, so you upload your own white logo and icon."];
  if (made.length) {
    parts.push(
      `Your auto-made ${made.map((a) => a.variantLabel.toLowerCase()).join(" and ")} will be deleted${
        picked ? `, and the ${picked === 1 ? "placement" : `${picked} placements`} that picked them go back to your default` : ""
      }.`
    );
  }
  parts.push("You can switch back to the landscape logo any time; that makes them again.");
  return parts.join(" ");
}
