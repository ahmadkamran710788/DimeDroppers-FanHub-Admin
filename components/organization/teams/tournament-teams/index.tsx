"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import Loader from "@/components/common/loader";
import { useSelectedEvent } from "@/context/selected-event";
import SearchInput from "@/components/common/search-input";
import { TeamRow, type DivisionGroup } from "@/components/organization/teams/tournament-event-row";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { DivisionTeamsTreeResponse, TournamentTotals, TreeEvent } from "@/utils/types/exposure-event";

// The open event and its open division (if any), which the page's stat cards narrow to.
export interface TournamentFocus {
  event: TreeEvent;
  division: { id: string; teamCount: number } | null;
}

interface TournamentTeamsProps {
  // The event picked in the page header ("" until the first one is picked).
  eventId: string;
  // Hands the organisation-wide totals (every answer carries them) to the page's stat cards.
  onTotals: (totals: TournamentTotals) => void;
  // The picked event and its open division; null until the event has loaded.
  focus: TournamentFocus | null;
  onFocus: (focus: TournamentFocus | null) => void;
}

// The event's divisions in order, then its teams without a division as "No Division".
function divisionsOf(event: TreeEvent): DivisionGroup[] {
  const divisions: DivisionGroup[] = [...event.divisions]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
    .map((d) => ({ id: d.id, name: d.name, teamCount: d.teamCount, teams: d.teams }));
  if (event.unassigned?.teamCount) {
    divisions.push({ id: "no-division", name: "No Division", teamCount: event.unassigned.teamCount, teams: event.unassigned.teams });
  }
  return divisions;
}

// A tournament's Teams page body: one event at a time (picked in the page header), one division at a
// time (the first until another is picked), and that division's teams. A team opens its own page. Data from GET
// /fanhub/org/exposure/events/division-teams?eventId=; the search narrows the teams by name here.
export default function TournamentTeams({ eventId, onTotals, focus, onFocus }: TournamentTeamsProps) {
  const [loaded, setLoaded] = useState<{ eventId: string; event: TreeEvent | null } | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiCall<DivisionTeamsTreeResponse>({
      endpoint: routes.api.exposureEventsDivisionTeams,
      method: "GET",
      data: { eventId, page: 1, limit: 1 },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      if (body?.totals) onTotals(body.totals);
      const event = body?.events?.[0] ?? null;
      setLoaded({ eventId, event });
      // The first division opens with the event, so the cards narrow to it.
      const first = event ? divisionsOf(event)[0] : undefined;
      onFocus(event ? { event, division: first ? { id: first.id, teamCount: first.teamCount } : null } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, onTotals, onFocus]);

  // No event to pick at all: an empty state, not a loader that never ends.
  const { noEvents } = useSelectedEvent();
  const loading = !noEvents && (!eventId || loaded?.eventId !== eventId);
  const event = loading ? null : (loaded?.event ?? null);

  const q = query.trim().toLowerCase();
  const divisions = event ? divisionsOf(event) : [];
  // The picked division (the first one until another is picked); only its teams are listed.
  const picked = divisions.find((d) => d.id === focus?.division?.id) ?? divisions[0];
  const teams = picked ? picked.teams.filter((t) => !q || t.name.toLowerCase().includes(q)) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          variant="dark"
          placeholder="Search teams..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search teams"
          className="w-full sm:w-72"
        />
        {divisions.length > 0 && (
          <FilterDropdown
            label="Division"
            icon={<Layers className="w-5 h-5" strokeWidth={1.5} />}
            options={divisions.map((d) => ({ label: `${d.name} (${d.teamCount})`, value: d.id }))}
            value={picked?.id ?? ""}
            onChange={(id) => {
              const d = divisions.find((x) => x.id === id);
              if (event && d) onFocus({ event, division: { id: d.id, teamCount: d.teamCount } });
            }}
          />
        )}
      </div>

      {noEvents && !eventId ? (
        <p className="py-12 text-center text-sm text-white/60">Pick an event to see its teams.</p>
      ) : loading ? (
        <Loader />
      ) : !event ? (
        <p className="py-12 text-center text-sm text-white/60">This event couldn&apos;t be loaded.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-white text-2xl font-extrabold font-display uppercase truncate">{event.name}</span>
          {!picked ? (
            <p className="py-10 text-center text-sm text-white/60">No divisions available for this event.</p>
          ) : teams.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/60">
              {q ? "No teams match your search." : "No teams available in this division."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {teams.map((t) => (
                <TeamRow key={t.id} team={t} href={routes.ui.tournamentTeam(event.id, t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
