"use client";

import { useRef } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import { LOGO_ACCEPT } from "@/components/sponsor/data";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import type { ProfileLogo } from "@/components/sponsor/profile/data";
import { SMALL_BUTTON } from "@/components/sponsor/profile/styles";

interface LogoRowProps {
  logo: ProfileLogo | null;
  // Shows Replace / Remove.
  editing: boolean;
  // The file picker's filter, from the sponsor options (SVG and PNG by default).
  accept?: string;
  // Why the picked file was refused.
  error?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

// The sponsor logo in Sponsor details: a 96px tile with the file name and format, and, while editing,
// buttons to replace or remove it.
export default function LogoRow({ logo, editing, accept = LOGO_ACCEPT, error, onPick, onRemove }: LogoRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-[18px] flex-wrap">
        {logo ? (
          <>
            <div className="size-24 shrink-0 rounded-[14px] flex items-center justify-center overflow-hidden bg-[#1b1b1b]">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 link or local object URL */}
              <img src={logo.url} alt="Your logo" className="max-w-full max-h-full object-contain p-2" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="text-[15px] font-semibold break-all">{logo.name}</div>
              <div className="text-[13px] text-[#a8a8a8]">{logo.spec}</div>
            </div>
          </>
        ) : (
          <div className="size-24 shrink-0 rounded-[14px] border-[1.5px] border-dashed border-[#555] flex items-center justify-center text-xs text-[#a8a8a8]">
            No logo
          </div>
        )}

        {editing && (
          <div className="flex gap-[10px] ml-auto">
            <Button
              label={logo ? "Replace" : "Upload logo"}
              onClick={() => inputRef.current?.click()}
              className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "px-4 text-sm font-semibold")}
            />
            {logo && (
              <Button
                label="Remove"
                onClick={onRemove}
                className={cn(SMALL_BUTTON, "px-4 bg-transparent border border-[#5a2a2a] text-[#ff9a9a] text-sm font-semibold")}
              />
            )}
            <HiddenFileInput ref={inputRef} accept={accept} onFiles={(files) => files[0] && onPick(files[0])} />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
