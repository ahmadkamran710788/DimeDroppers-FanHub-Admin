"use client";

import Button from "@/components/common/Button";
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
}

export default function FileUpload({
  label,
  helperText,
  accept,
  onFile,
  onClear,
  variant = "image",
  className,
}: FileUploadProps) {
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
    variant === "image" ? "Upload Logo" : "Drag & Drop your CSV file here.";
  const defaultHelper =
    variant === "image"
      ? "Size must be minimum 512x512 px, PNG, JPG, SVG (max 2MB)"
      : "Supports .csv files exported from scheduling platforms";
  const resolvedAccept = accept ?? (variant === "image" ? ".png,.jpg,.svg" : ".csv");

  const showImagePreview = variant === "image" && previewUrl;
  const meta = [dimensions, fileType].filter(Boolean).join(", ");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-base font-medium text-white">{label}</span>
      )}

      {showImagePreview ? (
        <div className="flex items-center justify-between gap-4 rounded-[8px] border-2 border-border-dashed px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-[60px] h-[60px] rounded-full shrink-0 overflow-hidden"
              style={{ background: "#231F20", outline: "2px solid rgba(255,255,255,0.5)", outlineOffset: "-2px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName ?? "Uploaded logo"}
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
              <span className="text-sm font-medium text-white truncate">{fileName}</span>
              {meta && (
                <span className="text-xs text-[rgba(255,255,255,0.4)]">{meta}</span>
              )}
            </div>
          </div>
          <Button label="Delete" variant="ghost" onClick={handleClear} className="w-24 h-12 shrink-0" />
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
            "border-[rgba(255,255,255,0.31)] bg-transparent px-4 py-6 cursor-pointer",
            "transition-colors hover:border-[rgba(255,255,255,0.5)]",
            dragging && "border-white bg-[rgba(255,255,255,0.04)]"
          )}
        >
          <CloudUpload className="w-6 h-6 text-white" strokeWidth={1.5} />
          <p className="text-base font-medium text-white text-center">
            {fileName ?? primaryText}
          </p>
          {!fileName && (
            <p className="text-sm text-[rgba(255,255,255,0.4)] text-center">
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
