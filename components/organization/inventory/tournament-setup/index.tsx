"use client";

import { Trophy } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import InventoryEventPicker from "@/components/organization/inventory/event-picker";
import type { TournamentFormat } from "@/utils/types/activations";

interface TournamentSetupProps {
  // The event whose inventory is open ("" until one is picked).
  eventId: string;
  eventName?: string;
  onEventChange: (id: string, name: string) => void;
  // Bumped after a save, so the event list's "Set up" status refreshes.
  refreshKey: number;
  // The open event's format and the options; absent while its inventory loads.
  format?: TournamentFormat | null;
  formatOptions?: { value: TournamentFormat; label: string }[];
  onFormatChange: (format: TournamentFormat) => void;
  // What still has to be picked before saving, e.g. "Select a format".
  missing: string[];
}

// Tournament only, above the columns: a tournament has one inventory per event, so the event is picked
// here (each with its own switches, exclusivities and format), then that event's format.
export default function TournamentSetup({
  eventId,
  eventName,
  onEventChange,
  refreshKey,
  format,
  formatOptions,
  onFormatChange,
  missing,
}: TournamentSetupProps) {
  return (
    // Above the category cards below, so the event and format lists open over their switches.
    <div className="relative z-20 rounded-[10px] border border-white/10 bg-[rgba(11,20,36,0.7)] backdrop-blur-[48px] p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-black text-xl uppercase text-white leading-none">Tournament Setup</h3>
        <p className="text-sm text-white/70">Each event has its own inventory. Pick an event, then its tournament format.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InventoryEventPicker value={eventId} selectedName={eventName} onChange={onEventChange} refreshKey={refreshKey} />
        {formatOptions && (
          <FilterDropdown
            label="Select format"
            icon={<Trophy className="w-5 h-5" strokeWidth={1.5} />}
            options={formatOptions}
            value={format ?? ""}
            onChange={(v) => v && onFormatChange(v as TournamentFormat)}
            // A format, once picked, can only be changed to another one.
            clearable={false}
          />
        )}
      </div>

      {missing.length > 0 && <p className="text-sm text-yellow-300">{`${missing.join(" and ")} for this event before saving.`}</p>}
    </div>
  );
}
