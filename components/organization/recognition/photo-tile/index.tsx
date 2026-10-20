import { GripVertical, X } from "lucide-react";
import Image from "next/image";
import Checkbox from "@/components/common/checkbox";
import { cn } from "@/utils/cn";

interface PhotoTileProps {
  src: string;
  alt: string;
  // Grid mode: toggles selection. Layout mode: pass onRemove instead.
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  // Highlights the tile while another photo is dragged over it.
  dropTarget?: boolean;
  className?: string;
  // Native drag-and-drop handlers, spread onto the tile.
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
}

// Fan photo thumbnail with a drag handle and either a select checkbox or a remove button.
export default function PhotoTile({ src, alt, selected, onToggle, onRemove, dropTarget, className, dragProps }: PhotoTileProps) {
  return (
    <div
      {...dragProps}
      className={cn(
        "group relative overflow-hidden rounded-[6px] border-2 bg-black/40 cursor-grab active:cursor-grabbing",
        selected ? "border-[#FF34BF]" : dropTarget ? "border-white/60" : "border-white/15",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        draggable={false}
        className="object-cover"
      />
      <span className="absolute top-1.5 left-1.5 size-8 rounded-[6px] bg-black/60 flex items-center justify-center">
        <GripVertical className="size-4 text-white" strokeWidth={2} />
      </span>
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${alt}` : `Select ${alt}`}
          className="absolute top-1.5 right-1.5 size-8 rounded-[6px] bg-black/60 flex items-center justify-center"
        >
          <Checkbox checked={!!selected} variant="white" />
        </button>
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
    </div>
  );
}
