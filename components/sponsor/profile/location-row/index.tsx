import { ExternalLink, MapPin, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import { formatAddress, locationLabel } from "@/components/sponsor/profile/data";
import type { SponsorLocation } from "@/utils/types/sponsor-profile";

const ROW_BUTTON =
  "min-w-0 h-11 px-[14px] rounded-[10px] bg-transparent border border-[#3a3a3a] text-sm font-semibold backdrop-blur-none";

interface LocationRowProps {
  location: SponsorLocation;
  onEdit: () => void;
  onRemove: () => void;
}

// One of the sponsor's locations: pin, name, address, where it came from, then Edit and Remove.
export default function LocationRow({ location, onEdit, onRemove }: LocationRowProps) {
  const label = locationLabel(location);
  const address = formatAddress(location);
  // The saved pin, not the store's Google listing (`sourceUrl`): the listing stays where Google has the store,
  // while the pin is what the search measures from and moves when the sponsor edits it.
  const mapUrl =
    location.latitude !== null && location.longitude !== null
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : null;

  return (
    <div className="flex gap-[14px] items-center flex-wrap bg-[#0b0b0b] border border-[#262626] rounded-[12px] p-4">
      <div className="size-11 shrink-0 rounded-[12px] bg-[#1d1d1d] flex items-center justify-center">
        <MapPin className="size-5 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
      </div>
      <div className="flex-[1_1_200px] min-w-0">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-base font-bold break-words min-w-0">{label}</span>
          {location.source === "AI" && (
            <StatusPill
              label="FOUND AUTOMATICALLY"
              color="bg-[#2a2148]"
              className="h-auto px-2 py-[3px]"
              textClassName="text-[11px] font-bold tracking-[1px] text-[#c9b8ff]"
            />
          )}
        </div>
        {address && address !== label && <div className="text-sm text-[#bdbdbd] mt-[3px] break-words">{address}</div>}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-sm text-[#c9b8ff] underline hover:text-white"
          >
            View on Google Maps
            <ExternalLink className="size-3.5" strokeWidth={1.8} aria-hidden />
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          label="Edit"
          icon={<Pencil className="size-4" strokeWidth={1.8} />}
          aria-label={`Edit ${label}`}
          onClick={onEdit}
          className={cn(ROW_BUTTON, "text-white")}
        />
        <Button
          label="Remove"
          icon={<Trash2 className="size-4" strokeWidth={1.8} />}
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className={cn(ROW_BUTTON, "text-[#ff9a9a]")}
        />
      </div>
    </div>
  );
}
