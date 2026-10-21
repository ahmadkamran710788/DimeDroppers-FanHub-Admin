"use client";

import { useState, type RefObject } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import HiddenFileInput from "@/components/common/hidden-file-input";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import { UPLOAD_ACCEPT, UPLOAD_LIMITS } from "@/components/sponsor/brand-assets/data";

interface AssetDropzoneProps {
  // The picker's input, shared with the page's "Upload assets" button.
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
}

// Dashed drop target above the library; Browse files opens the same picker.
export default function AssetDropzone({ inputRef, onFiles }: AssetDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
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
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "relative rounded-[8px] border-[1.5px] border-dashed p-6 flex flex-wrap gap-[18px] items-center justify-between transition-colors",
        dragging ? "border-[#8b6dff] bg-[#17151f]" : "border-[#4a3f7a] bg-[#0e0c16]"
      )}
    >
      <div className="flex gap-4 items-center">
        <div className="size-[52px] shrink-0 rounded-[12px] bg-[#2a2148] flex items-center justify-center">
          <Upload className="size-6" strokeWidth={1.8} />
        </div>
        <div>
          <div className="text-[17px] font-bold">Drop files here to add them</div>
          <div className="text-sm text-[#bdbdbd] mt-[2px]">{UPLOAD_LIMITS.hint}</div>
        </div>
      </div>
      <Button
        label="Browse files"
        onClick={() => inputRef.current?.click()}
        className={cn(OUTLINE_BUTTON, "h-11 px-[18px] rounded-[10px] text-[15px] font-semibold")}
      />
      <HiddenFileInput ref={inputRef} accept={UPLOAD_ACCEPT.all} multiple onFiles={onFiles} />
    </div>
  );
}
