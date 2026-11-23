import { cn } from "@/utils/cn";
import Loader from "@/components/common/loader";
import { fmtEventDate, nearText } from "@/components/sponsor/find-organizations/data";
import type { SponsorEventOption } from "@/utils/types/sponsor-packages";

interface EventListProps {
  events: SponsorEventOption[];
  loading: boolean;
  error?: string;
  // The picked event, whose packages the panel shows.
  eventId?: string;
  onSelect: (eventId: string) => void;
}

// A selected tournament's events, under its card: only the ones that can be sponsored. Picking one
// prices the packages panel for it.
export default function EventList({ events, loading, error, eventId, onSelect }: EventListProps) {
  return (
    <div role="group" aria-label="Events" className="ml-4 pl-4 border-l-2 border-[#8b6dff]/40 flex flex-col gap-1.5">
      <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">
        {loading ? "EVENTS" : `EVENTS · ${events.length}`}
      </div>
      {loading ? (
        <Loader size="sm" className="justify-start py-2" />
      ) : events.length === 0 ? (
        <p className="text-sm text-[#a8a8a8]">{error ?? "None of this tournament's events can be sponsored yet."}</p>
      ) : (
        events.map((e) => (
          // A whole clickable row, not an action button, so it stays a native button.
          <button
            key={e.id}
            type="button"
            aria-pressed={e.id === eventId}
            onClick={() => onSelect(e.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-[10px] border flex flex-col gap-0.5 text-white cursor-pointer",
              e.id === eventId ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#141414] border-[#222]"
            )}
          >
            <span className="text-[15px] font-semibold">{e.name?.trim() || "Untitled event"}</span>
            <span className="text-[13px] text-[#a8a8a8]">
              {[
                fmtEventDate(e.startDate),
                [e.city, e.state].filter(Boolean).join(", "),
                `${e.teamCount} teams · ${e.divisionCount} divisions · ${e.games} games`,
                e.tournamentFormatLabel,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {e.nearLocations.length > 0 && <span className="text-[13px] text-[#c9b8ff]">{`Near ${nearText(e)}`}</span>}
          </button>
        ))
      )}
    </div>
  );
}
