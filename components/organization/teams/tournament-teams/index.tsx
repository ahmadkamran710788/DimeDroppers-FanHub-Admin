"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/loader";
import SearchInput from "@/components/common/search-input";
import { DivisionRow, type DivisionGroup } from "@/components/organization/teams/tournament-event-row";
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

// A tournament's Teams page body: one event at a time (picked in the page header), its
// divisions, then each division's teams. A team opens its own page. Data from GET
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
      onFocus(event ? { event, division: null } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, onTotals, onFocus]);

  const loading = !eventId || loaded?.eventId !== eventId;
  const event = loading ? null : (loaded?.event ?? null);

  const q = query.trim().toLowerCase();
  const divisions: DivisionGroup[] = [...(event?.divisions ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
    .map((d) => ({ id: d.id, name: d.name, teamCount: d.teamCount, teams: d.teams }));
  if (event?.unassigned?.teamCount) {
    divisions.push({ id: "no-division", name: "No Division", teamCount: event.unassigned.teamCount, teams: event.unassigned.teams });
  }
  const shown = q
    ? divisions
        .map((d) => {
          const teams = d.teams.filter((t) => t.name.toLowerCase().includes(q));
          // The row counts the matching teams.
          return { ...d, teams, teamCount: teams.length };
        })
        .filter((d) => d.teams.length > 0)
    : divisions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex">
        <SearchInput
          variant="dark"
          placeholder="Search teams..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // A search closes the open division, so the cards go back to the whole event.
            if (event && focus?.division) onFocus({ event, division: null });
          }}
          aria-label="Search teams"
          className="w-full sm:w-72"
        />
      </div>

      {loading ? (
        <Loader />
      ) : !event ? (
        <p className="py-12 text-center text-sm text-white/60">This event couldn&apos;t be loaded.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-white text-2xl font-extrabold font-display uppercase truncate">{event.name}</span>
          {divisions.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/60">No divisions available for this event.</p>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/60">No teams match your search.</p>
          ) : (
            shown.map((d) => (
              <DivisionRow
                key={d.id}
                division={d}
                teamHref={(t) => routes.ui.tournamentTeam(event.id, t.id)}
                defaultOpen={!!q}
                // While searching every matching division is open; otherwise one at a time.
                open={q ? undefined : focus?.division?.id === d.id}
                onToggle={
                  q
                    ? undefined
                    : () => onFocus({ event, division: focus?.division?.id === d.id ? null : { id: d.id, teamCount: d.teamCount } })
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
