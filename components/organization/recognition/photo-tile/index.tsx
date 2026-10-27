import { GripVertical, X } from "lucide-react";
import Image from "next/image";
import Checkbox from "@/components/common/checkbox";
import { cn } from "@/utils/cn";
import { evictPhotoboothImage } from "@/utils/photobooth-image-cache";

interface PhotoTileProps {
  src: string;
  alt: string;
  // Grid mode: toggles selection. Layout mode: pass onRemove instead.
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  // Already on the fan wall: shows a badge instead of the checkbox and can't be dragged again.
  added?: boolean;
  // Lines over the bottom of the image, e.g. the fan's name and the template.
  caption?: string;
  subcaption?: string;
  // Highlights the tile while another photo is dragged over it.
  dropTarget?: boolean;
  className?: string;
  // Native drag-and-drop handlers, spread onto the tile.
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
}

// Fan photo thumbnail with a drag handle and either a select checkbox or a remove button.
export default function PhotoTile({
  src,
  alt,
  selected,
  onToggle,
  onRemove,
  added = false,
  caption,
  subcaption,
  dropTarget,
  className,
  dragProps,
}: PhotoTileProps) {
  return (
    <div
      {...(added ? {} : dragProps)}
      className={cn(
        "group relative overflow-hidden rounded-[6px] border-2 bg-black/40",
        added ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        selected ? "border-[#FF34BF]" : dropTarget ? "border-white/60" : "border-white/15",
        className
      )}
    >
      {/* Pulses behind the image while it loads; the image covers it once there. */}
      <span aria-hidden className="absolute inset-0 animate-pulse bg-white/[0.06]" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        draggable={false}
        // Fan images are presigned S3 URLs, loaded straight from S3: the optimizer would have to fetch
        // each full image server-side first, which times out (and each URL's signature changes).
        unoptimized={src.startsWith("http")}
        // A failed download mustn't stay in the image cache; the next load fetches it again.
        onError={() => evictPhotoboothImage(src)}
        className={cn("object-cover", added && "opacity-60")}
      />
      {!added && (
        <span className="absolute top-1.5 left-1.5 size-8 rounded-[6px] bg-black/60 flex items-center justify-center">
          <GripVertical className="size-4 text-white" strokeWidth={2} />
        </span>
      )}
      {added ? (
        <span className="absolute top-1.5 right-1.5 h-7 px-2 rounded-[6px] bg-success/90 flex items-center text-xs font-semibold text-white">
          On wall
        </span>
      ) : (
        onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={selected ? `Deselect ${alt}` : `Select ${alt}`}
            className="absolute top-1.5 right-1.5 size-8 rounded-[6px] bg-black/60 flex items-center justify-center"
          >
            <Checkbox checked={!!selected} variant="white" />
          </button>
        )
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${alt} from the fan wall`}
          className="absolute top-1.5 right-1.5 size-8 rounded-[6px] bg-black/60 flex items-center justify-center hover:bg-black/70"
        >
          <X className="size-4 text-white" strokeWidth={2.5} />
        </button>
      )}
      {caption && (
        <span className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/85 to-transparent flex flex-col text-white">
          <span className="text-xs font-semibold truncate">{caption}</span>
          {subcaption && <span className="text-[11px] text-white/75 truncate">{subcaption}</span>}
        </span>
      )}
    </div>
  );
}
