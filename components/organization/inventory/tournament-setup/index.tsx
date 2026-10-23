"use client";

import { Trophy, X } from "lucide-react";
import Button from "@/components/common/button";
import FilterDropdown from "@/components/common/filter-dropdown";
import EventSelect from "@/components/organization/event-select";
import type { PickedEvent } from "@/components/organization/inventory/use-inventory";
import type { TournamentFormat } from "@/utils/types/activations";

interface TournamentSetupProps {
  events: PickedEvent[];
  format: TournamentFormat | null;
  formatOptions: { value: TournamentFormat; label: string }[];
  onAddEvent: (event: PickedEvent) => void;
  onRemoveEvent: (id: string) => void;
  onFormatChange: (format: TournamentFormat) => void;
  // What still has to be picked before saving, e.g. "Select a format".
  missing: string[];
}

// Tournament only, above the columns: the events the inventory covers (one or more) and the tournament
// format. Both are needed before the inventory can be saved.
export default function TournamentSetup({
  events,
  format,
  formatOptions,
  onAddEvent,
  onRemoveEvent,
  onFormatChange,
  missing,
}: TournamentSetupProps) {
  return (
    // Above the category cards below, so the event and format lists open over their switches.
    <div className="relative z-20 rounded-[10px] border border-white/10 bg-[rgba(11,20,36,0.7)] backdrop-blur-[48px] p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-black text-xl uppercase text-white leading-none">Tournament Setup</h3>
        <p className="text-sm text-white/70">Pick the events this inventory covers and the tournament format.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <EventSelect
          value=""
          onChange={(id, name) => id && onAddEvent({ id, name })}
          addLabel="Add event"
          exclude={events.map((e) => e.id)}
          // The card sits by the sidebar, so the list opens to the right.
          align="left"
        />
        <FilterDropdown
          label="Select format"
          icon={<Trophy className="w-5 h-5" strokeWidth={1.5} />}
          options={formatOptions}
          value={format ?? ""}
          onChange={(v) => v && onFormatChange(v as TournamentFormat)}
          // A format, once picked, can only be changed to another one.
          clearable={false}
        />
      </div>

      {events.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected events">
          {events.map((e) => (
            <li key={e.id} className="h-9 pl-3 pr-1 rounded-full bg-white/10 flex items-center gap-1 text-sm text-white">
              <span className="max-w-[260px] truncate">{e.name}</span>
              <Button
                size="icon"
                icon={<X className="size-4" />}
                aria-label={`Remove ${e.name}`}
                onClick={() => onRemoveEvent(e.id)}
                className="size-7 bg-transparent hover:bg-white/10"
              />
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && <p className="text-sm text-yellow-300">{`${missing.join(" and ").replace(/^./, (c) => c.toUpperCase())} before saving.`}</p>}
    </div>
  );
}
