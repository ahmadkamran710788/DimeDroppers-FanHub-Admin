"use client";

import Checkbox from "@/components/common/checkbox";
import Loader from "@/components/common/loader";
import type { TicketGame } from "@/utils/types/tickets";

// A game in the list; `ended` marks one that has started or is past (it can no longer sell), and
// `takenBy` names the other active campaign it already sells through (a game has one at a time).
export type PickerGame = TicketGame & { sports?: string | null; level?: string | null; ended?: boolean; takenBy?: string };

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Clickable rows (checkbox, matchup, date): native <button>s, not action buttons.
const ROW =
  "cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F6F8] transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent";

interface GamePickerProps {
  games: PickerGame[];
  loading: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

// A checklist of games: the ones a new ticket campaign is sold for, or the ones an existing
// campaign is attached to. The list grows with the dialog's own scroll rather than scrolling alone.
export default function GamePicker({ games, loading, selected, onChange, label = "Games", required = false, error }: GamePickerProps) {
  // Games of another campaign can't be picked, so "Select all" covers the rest.
  const pickable = games.filter((g) => !g.takenBy);
  const allSelected = pickable.length > 0 && pickable.every((g) => selected.includes(g.id));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div className="w-full shrink-0 flex flex-col gap-2">
      <span className="text-sm font-medium text-midnight-navy">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <div className="rounded-[12px] overflow-hidden border border-[rgba(11,28,45,0.12)] divide-y divide-[rgba(11,28,45,0.08)] bg-white">
        {loading ? (
          <Loader className="m-6" />
        ) : games.length === 0 ? (
          <p className="p-4 text-sm text-midnight-navy/60">No upcoming games on your schedule.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : pickable.map((g) => g.id))}
              disabled={pickable.length === 0}
              className={ROW}
            >
              <Checkbox
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                className={allSelected || selected.length > 0 ? undefined : "border-midnight-navy/30"}
              />
              <span className="text-sm font-semibold text-midnight-navy">{`Select all (${pickable.length})`}</span>
            </button>
            {games.map((g) => {
              const checked = selected.includes(g.id);
              return (
                <button key={g.id} type="button" onClick={() => toggle(g.id)} disabled={!!g.takenBy} className={ROW}>
                  <Checkbox checked={checked} className={checked ? undefined : "border-midnight-navy/30"} />
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-sm font-medium text-midnight-navy truncate">{g.opponent ? `vs ${g.opponent}` : g.title}</span>
                    <span className="text-xs text-midnight-navy/60 truncate">
                      {[fmtWhen(g.start), g.sports, g.level].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {g.takenBy && (
                    <span className="shrink-0 max-w-[45%] truncate text-[11px] font-medium text-midnight-navy/60 bg-[#F5F6F8] px-2 py-0.5 rounded-full">
                      {`In ${g.takenBy}`}
                    </span>
                  )}
                  {g.ended && (
                    <span className="shrink-0 text-[11px] font-medium text-midnight-navy/60 bg-[#F5F6F8] px-2 py-0.5 rounded-full">Ended</span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
