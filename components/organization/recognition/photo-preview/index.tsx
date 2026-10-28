"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";

export interface PhotoPreviewItem {
  src: string;
  alt: string;
  caption?: string;
  subcaption?: string;
}

interface PhotoPreviewProps {
  photo: PhotoPreviewItem | null;
  onClose: () => void;
}

// A fan photo at full size in a popup. The tile already downloaded the image, so the photobooth image
// cache (utils/photobooth-image-cache) serves it here without downloading it again.
export default function PhotoPreview({ photo, onClose }: PhotoPreviewProps) {
  return (
    <Modal isOpen={!!photo} onClose={onClose} className="max-w-[min(900px,calc(100vw-2rem))] p-3 gap-3 bg-[#0B1220]">
      {photo && (
        <>
          <Button
            size="icon"
            icon={<X className="size-5" />}
            aria-label="Close preview"
            onClick={onClose}
            className="absolute top-5 right-5 z-10 size-9 bg-black/60 hover:bg-black/75 text-white"
          />
          <Image
            src={photo.src}
            alt={photo.alt}
            width={1587}
            height={1587}
            unoptimized={photo.src.startsWith("http")}
            className="w-auto h-auto max-w-full max-h-[80vh] rounded-2xl object-contain"
          />
          {photo.caption && (
            <div className="w-full px-1 flex flex-col text-white">
              <span className="text-sm font-semibold truncate">{photo.caption}</span>
              {photo.subcaption && <span className="text-xs text-white/70 truncate">{photo.subcaption}</span>}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
