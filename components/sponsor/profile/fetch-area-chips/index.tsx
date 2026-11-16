import { CircleCheck, MapPin, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";
import Loader from "@/components/common/loader";
import type { SponsorFetchArea, SponsorFetchAreaResult } from "@/utils/types/sponsor-profile";

const CHIP = "inline-flex items-center gap-2 max-w-full rounded-full border px-3 py-1.5 text-sm";
const ICON = "size-4 shrink-0";

interface FetchAreaChipsProps {
  // The states, cities and ZIP codes a fetch searches, in the order picked.
  areas: SponsorFetchArea[];
  // Once the fetch is done: each area's locations, by area. Without them each area shows what it's doing.
  results?: SponsorFetchAreaResult[];
  // The fetch is saving what it found.
  saving?: boolean;
}

// One chip per area of a location fetch. While it runs: searching, saving, or why an area can't be searched
// ("Not found on the map"); a ZIP code's label gets its city once it's on the map. Once done: how many
// locations each area has and how many are new.
export default function FetchAreaChips({ areas, results, saving = false }: FetchAreaChipsProps) {
  if (areas.length === 0) return null;

  return (
    <ul aria-label="Areas searched" className="flex flex-wrap gap-2">
      {areas.map((area) => {
        if (area.error) {
          return (
            <li key={area.key} className={cn(CHIP, "border-[#6b5420] bg-[#1d1709] text-[#f5dc9c]")}>
              <TriangleAlert className={cn(ICON, "text-[#f0c050]")} strokeWidth={2} aria-hidden />
              <span className="min-w-0 break-words">
                <span className="font-semibold">{area.label}</span> · {area.error}
              </span>
            </li>
          );
        }

        if (results) {
          const block = results.find((r) => r.area.key === area.key);
          const count = block?.locationCount ?? 0;
          const fresh = block?.newCount ?? 0;
          return (
            <li
              key={area.key}
              className={cn(
                CHIP,
                count > 0 ? "border-[#2f5a30] bg-[#111d12] text-[#d6f0d6]" : "border-[#333] bg-[#0b0b0b] text-[#bdbdbd]"
              )}
            >
              {count > 0 ? (
                <CircleCheck className={cn(ICON, "text-[#a3e3a5]")} strokeWidth={2} aria-hidden />
              ) : (
                <MapPin className={cn(ICON, "text-[#8a8a8a]")} strokeWidth={2} aria-hidden />
              )}
              <span className="min-w-0 break-words">
                <span className="font-semibold">{area.label}</span> ·{" "}
                {count === 0 ? "none found" : fresh > 0 ? `${count} (${fresh} new)` : `${count}`}
              </span>
            </li>
          );
        }

        // A ZIP code has no state until the fetch has placed it on the map.
        const placing = area.kind === "ZIP" && !area.state;
        return (
          <li key={area.key} className={cn(CHIP, "border-[#4a3f7a] bg-[#1d1930] text-white")}>
            <Loader size="sm" />
            <span className="min-w-0 break-words">
              <span className="font-semibold">{area.label}</span>
              <span className="text-[#bdbdbd]">
                {" · "}
                {saving ? "Saving" : placing ? "Finding it on the map" : "Searching"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
