"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import type { LogoRules } from "@/utils/types/sponsor-profile";

export interface PickedLogo {
  file: File;
  // Object URL for the preview; the owner revokes it.
  url: string;
}

interface LogoUploadProps {
  logo: PickedLogo | null;
  // From the sponsor options: the file picker's filter and the hint under the drop zone.
  rules: LogoRules;
  // Why the picked file was refused (checked by the owner with checkLogo, or by the API on Finish).
  error?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

// The sponsor's logo: a dashed drop target (click or drop a file), then the picked file with Remove.
export default function LogoUpload({ logo, rules, error, onPick, onRemove }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: File[]) {
    if (files[0]) onPick(files[0]);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className={SECTION_LABEL}>SPONSOR LOGO</div>

      {logo ? (
        <div className="flex items-center gap-4 flex-wrap bg-[#0b0b0b] border border-[#262626] rounded-[14px] p-[14px]">
          <div className="size-20 shrink-0 rounded-[12px] bg-[#1f1a33] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={logo.url} alt="Your logo" className="max-w-full max-h-full object-contain p-2" />
          </div>
          <div className="flex-[1_1_160px] min-w-0">
            <div className="text-[15px] font-semibold truncate">{logo.file.name}</div>
            <div className="text-[13px] text-[#a3e3a5] mt-[2px]">Uploaded</div>
          </div>
          <Button
            label="Remove"
            onClick={onRemove}
            className="min-w-0 h-11 px-4 bg-transparent border border-[#5a2a2a] text-[#ff9a9a] rounded-[10px] text-sm font-semibold backdrop-blur-none"
          />
        </div>
      ) : (
        // A whole clickable drop zone (icon and two lines of text), not an action button.
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            // Moving onto a child also fires dragleave; only leaving the zone itself counts.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "min-h-[120px] rounded-[14px] border-[1.5px] border-dashed text-white flex flex-col items-center justify-center gap-2 transition-colors",
            dragging ? "border-[#8b6dff] bg-[#17151f]" : "border-[#4a3f7a] bg-[#0e0c16]",
            error && "border-error"
          )}
        >
          <Upload className="size-[26px]" strokeWidth={1.8} aria-hidden />
          <span className="text-base font-bold">Upload your logo</span>
          <span className="text-[13px] text-[#bdbdbd]">
            SVG or PNG, at least {rules.minWidth}×{rules.minHeight}
          </span>
        </button>
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      <HiddenFileInput ref={inputRef} accept={rules.types.join(",")} onFiles={pick} />
    </div>
  );
}
