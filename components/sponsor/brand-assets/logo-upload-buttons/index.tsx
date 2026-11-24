"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import { logoAccept } from "@/components/sponsor/data";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import type { LogoVariant, MainLogo } from "@/utils/types/sponsor-brand-assets";

// The picker filter until the rules from GET /brand-assets/options arrive.
const FALLBACK_ACCEPT = ".svg,.png,.jpg,.jpeg";

interface UploadKind {
  variant: LogoVariant;
  // The main logo this kind is, so its button is the solid one.
  mainLogo: MainLogo;
  // Until the API's label arrives.
  label: string;
}

// The two main kinds, uploaded from the page header. The white logo and icon are uploaded from their own cards.
const KINDS: UploadKind[] = [
  { variant: "FULL_COLOR", mainLogo: "LANDSCAPE", label: "Landscape logo" },
  { variant: "CIRCULAR", mainLogo: "CIRCULAR", label: "Circular logo" },
];

interface LogoUploadButtonsProps {
  logos: BrandLogos;
}

// "Upload landscape logo" and "Upload circular logo" on Brand Assets. The main logo's kind is the solid button,
// since that's the one slots show. Wait for the rules to load and for any upload to finish.
export default function LogoUploadButtons({ logos }: LogoUploadButtonsProps) {
  // Only the kinds the API offers, once its rules are in.
  const kinds = KINDS.filter((k) => !logos.options || logos.specOf(k.variant));

  return (
    <div className="flex flex-wrap gap-3">
      {kinds.map((kind) => (
        <UploadButton key={kind.variant} kind={kind} logos={logos} />
      ))}
    </div>
  );
}

interface UploadButtonProps {
  kind: UploadKind;
  logos: BrandLogos;
}

function UploadButton({ kind, logos }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const spec = logos.specOf(kind.variant);
  const label = (spec?.label ?? kind.label).toLowerCase();
  const uploading = logos.busy === `upload:${kind.variant}`;
  const anyUpload = logos.busy?.startsWith("upload:") ?? false;

  // One after another, so each gets its own check and message.
  async function uploadAll(files: File[]) {
    for (const file of files) await logos.upload(kind.variant, file);
  }

  return (
    <>
      <Button
        label={uploading ? "Uploading…" : `Upload ${label}`}
        icon={<Upload className="size-5" strokeWidth={2} />}
        disabled={!logos.options || anyUpload}
        onClick={() => inputRef.current?.click()}
        className={cn(
          logos.mainLogo === kind.mainLogo ? PRIMARY_BUTTON : OUTLINE_BUTTON,
          "h-[52px] px-[22px] gap-[10px] rounded-[12px] text-base"
        )}
      />
      <HiddenFileInput ref={inputRef} accept={spec ? logoAccept(spec) : FALLBACK_ACCEPT} multiple onFiles={uploadAll} />
    </>
  );
}
