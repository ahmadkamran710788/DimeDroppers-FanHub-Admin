"use client";

import Image from "next/image";
import Button from "@/components/common/button";
import { cn } from "@/utils/cn";
import { CloudUpload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FileUploadProps {
  label?: string;
  helperText?: string;
  accept?: string;
  /** Called when a file is selected. `url` is an object URL for image variants (null for csv). */
  onFile: (file: File, url: string | null) => void;
  /** Called when the uploaded file is removed via the Delete button. */
  onClear?: () => void;
  variant?: "image" | "csv";
  className?: string;
  /** When set and no new file has been picked, shows this URL as the existing logo with a "Change Logo" button. */
  existingUrl?: string;
  /** "dark" (default): white text on dark cards. "light": navy text inside a white modal. */
  tone?: "dark" | "light";
  /** Overrides the dropzone headline (defaults to "Upload Logo" / the CSV prompt). */
  prompt?: string;
}

export default function FileUpload({
  label,
  helperText,
  accept,
  onFile,
  onClear,
  variant = "image",
  className,
  existingUrl,
  tone = "dark",
  prompt,
}: FileUploadProps) {
  const light = tone === "light";
  const text = light ? "text-midnight-navy" : "text-white";
  const muted = light ? "text-midnight-navy/50" : "text-[rgba(255,255,255,0.4)]";
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string | null>(null);

  // Revoke any outstanding object URL on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const isImage = variant === "image";
    const url = isImage ? URL.createObjectURL(file) : null;
    setFileName(file.name);
    setFileType(file.type.split("/")[1]?.toUpperCase() ?? null);
    setPreviewUrl(url);
    setDimensions(null);
    onFile(file, url);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFileName(null);
    setFileType(null);
    setPreviewUrl(null);
    setDimensions(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const primaryText =
    prompt ?? (variant === "image" ? "Upload Logo" : "Drag & Drop your CSV file here.");
  const defaultHelper =
    variant === "image"
      ? "Size must be minimum 512x512 px, PNG, JPG, SVG (max 2MB)"
      : "Supports .csv files exported from scheduling platforms";
  const resolvedAccept = accept ?? (variant === "image" ? ".png,.jpg,.svg" : ".csv");

  const showImagePreview = variant === "image" && previewUrl;
  const showExisting = variant === "image" && !previewUrl && !!existingUrl;
  const meta = [dimensions, fileType].filter(Boolean).join(", ");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className={cn("text-base font-medium", text)}>{label}</span>
      )}

      {showImagePreview ? (
        <div className="flex items-center justify-between gap-4 rounded-[8px] border-2 border-border-dashed px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-[60px] h-[60px] rounded-full shrink-0 overflow-hidden"
              style={{ background: "#231F20", outline: "2px solid rgba(255,255,255,0.5)", outlineOffset: "-2px" }}
            >
              <Image
                src={previewUrl}
                alt={fileName ?? "Uploaded logo"}
                width={60}
                height={60}
                // Local blob: preview, so skip the image optimizer.
                unoptimized
                className="w-full h-full object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setDimensions(`${img.naturalWidth}x${img.naturalHeight}`);
                  }
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn("text-sm font-medium truncate", text)}>{fileName}</span>
              {meta && <span className={cn("text-xs", muted)}>{meta}</span>}
            </div>
          </div>
          <Button label="Delete" variant={light ? "secondary" : "ghost"} onClick={handleClear} className="w-24 h-12 shrink-0" />
        </div>
      ) : showExisting ? (
        <div className="flex items-center justify-between gap-4 rounded-[8px] border-2 border-border-dashed px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-[60px] h-[60px] rounded-full shrink-0 overflow-hidden"
              style={{ background: "#231F20", outline: "2px solid rgba(255,255,255,0.5)", outlineOffset: "-2px" }}
            >
              <Image
                src={existingUrl}
                alt="Current logo"
                width={60}
                height={60}
                // Uploaded logos may live on a remote host with no configured image domain.
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <span className={cn("text-sm font-medium", text)}>Current logo</span>
          </div>
          <Button label="Change Logo" variant={light ? "secondary" : "ghost"} onClick={() => inputRef.current?.click()} className="w-32 h-12 shrink-0 text-xs" />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed",
            "bg-transparent px-4 py-6 cursor-pointer transition-colors",
            light
              ? "border-[rgba(11,28,45,0.25)] hover:border-steel-blue"
              : "border-[rgba(255,255,255,0.31)] hover:border-[rgba(255,255,255,0.5)]",
            dragging && (light ? "border-steel-blue bg-steel-blue/5" : "border-white bg-[rgba(255,255,255,0.04)]")
          )}
        >
          <CloudUpload className={cn("w-6 h-6", text)} strokeWidth={1.5} />
          <p className={cn("text-base font-medium text-center", text)}>
            {fileName ?? primaryText}
          </p>
          {!fileName && (
            <p className={cn("text-sm text-center", muted)}>
              {helperText ?? defaultHelper}
            </p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={resolvedAccept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
