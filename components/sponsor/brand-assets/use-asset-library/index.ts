"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/utils/helper";
import {
  ASSETS,
  UPLOAD_LIMITS,
  type AssetFileKind,
  type AssetFilter,
  type AssetType,
  type BrandAsset,
} from "@/components/sponsor/brand-assets/data";

// Thumbnail background behind an uploaded file's preview.
const UPLOAD_BG = "#1b1b1b";

const extensionOf = (file: File) => file.name.split(".").pop()?.toLowerCase() ?? "";

const fileKind = (ext: string): AssetFileKind => (ext === "mp4" ? "video" : ext === "pdf" ? "document" : "image");

// Why a file can't be uploaded, or null when it can.
function rejectReason(file: File): string | null {
  const ext = extensionOf(file);
  const isVideo = UPLOAD_LIMITS.videoExtensions.includes(ext);
  if (!isVideo && !UPLOAD_LIMITS.fileExtensions.includes(ext)) return `${file.name} isn't an SVG, PNG, PDF or MP4 file`;
  const max = isVideo ? UPLOAD_LIMITS.maxVideoBytes : UPLOAD_LIMITS.maxFileBytes;
  if (file.size > max) return `${file.name} is over ${formatFileSize(max)}`;
  return null;
}

// The Brand Assets library. Uploads, replacements and deletes live in memory until the sponsor
// API is integrated.
export function useAssetLibrary() {
  const [assets, setAssets] = useState<BrandAsset[]>(ASSETS);
  const nextId = useRef(0);
  // Object URLs of uploaded files, revoked when their asset is replaced or deleted, or the page closes.
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const live = urls.current;
    return () => live.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function release(asset: BrandAsset | undefined) {
    if (!asset?.file) return;
    URL.revokeObjectURL(asset.file.url);
    urls.current.delete(asset.file.url);
  }

  // A preview and spec for the file, or null (after an error toast) when it can't be used.
  function toUpload(file: File) {
    const reason = rejectReason(file);
    if (reason) {
      toast.error(reason);
      return null;
    }
    const ext = extensionOf(file);
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    return { file: { url, kind: fileKind(ext) }, spec: `${ext.toUpperCase()} · ${formatFileSize(file.size)}` };
  }

  // Adds the files as new assets awaiting review. MP4s go to Video; other files to the selected
  // type, or Logos when no single type is selected.
  function addFiles(files: File[], filter: AssetFilter) {
    const added: BrandAsset[] = [];
    for (const f of files) {
      const upload = toUpload(f);
      if (!upload) continue;
      const type: AssetType = upload.file.kind === "video" ? "Video" : filter === "All" || filter === "Video" ? "Logos" : filter;
      added.push({
        id: `upload-${nextId.current++}`,
        type,
        name: f.name.replace(/\.[^.]+$/, ""),
        spec: upload.spec,
        usage: "Not in use yet",
        status: "In review",
        bg: UPLOAD_BG,
        file: upload.file,
      });
    }
    if (added.length === 0) return;
    setAssets((prev) => [...added, ...prev]);
    toast.success(added.length === 1 ? `${added[0].name} added` : `${added.length} assets added`);
  }

  // Swaps an asset's file for a new one of the same kind (video for video), and sends it back to review.
  function replaceFile(id: string, file: File) {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const isVideo = asset.type === "Video";
    if (isVideo !== (extensionOf(file) === "mp4")) {
      toast.error(isVideo ? `Replace ${asset.name} with an MP4 file` : `Replace ${asset.name} with an SVG, PNG or PDF file`);
      return;
    }
    const upload = toUpload(file);
    if (!upload) return;
    release(asset);
    setAssets((prev) =>
      prev.map((a): BrandAsset =>
        a.id === id ? { ...a, spec: upload.spec, status: "In review", bg: UPLOAD_BG, duration: undefined, file: upload.file } : a
      )
    );
    toast.success(`${asset.name} replaced`);
  }

  function removeAsset(id: string) {
    release(assets.find((a) => a.id === id));
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return { assets, addFiles, replaceFile, removeAsset };
}
