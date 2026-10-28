import { MapPin, Trash2 } from "lucide-react";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import { formatAddress, type SponsorLocation } from "@/components/sponsor/profile/data";

interface LocationRowProps {
  location: SponsorLocation;
  primary: boolean;
  onRemove: () => void;
}

// One of the sponsor's locations: pin, name (PRIMARY for the first), address and Remove.
export default function LocationRow({ location, primary, onRemove }: LocationRowProps) {
  return (
    <div className="flex gap-[14px] items-center flex-wrap bg-[#0b0b0b] border border-[#262626] rounded-[12px] p-4">
      <div className="size-11 shrink-0 rounded-[12px] bg-[#1d1d1d] flex items-center justify-center">
        <MapPin className="size-5 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
      </div>
      <div className="flex-[1_1_200px] min-w-0">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-base font-bold break-words min-w-0">{location.name}</span>
          {primary && (
            <StatusPill
              label="PRIMARY"
              color="bg-[#1d3a1e]"
              className="h-auto px-2 py-[3px]"
              textClassName="text-[11px] font-bold tracking-[1px] text-[#a3e3a5]"
            />
          )}
        </div>
        <div className="text-sm text-[#bdbdbd] mt-[3px] break-words">{formatAddress(location)}</div>
      </div>
      <Button
        label="Remove"
        icon={<Trash2 className="size-4" strokeWidth={1.8} />}
        aria-label={`Remove ${location.name}`}
        onClick={onRemove}
        className="min-w-0 h-11 px-[14px] rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#ff9a9a] text-sm font-semibold backdrop-blur-none"
      />
    </div>
  );
}
