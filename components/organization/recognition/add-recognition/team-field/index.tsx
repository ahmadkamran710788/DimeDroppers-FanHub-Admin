"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import Select from "@/components/common/select";
import EventSelect from "@/components/organization/event-select";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import { useSelectedEvent } from "@/context/selected-event";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { DivisionTeamsTreeResponse, TreeEvent } from "@/utils/types/exposure-event";

export interface PickedTeam {
  id: string;
  name: string;
  // A school team's sport.
  sport?: string;
}

interface TeamFieldProps {
  teamId: string;
  onTeam: (team: PickedTeam) => void;
  error?: string;
}

// A tournament team: the event from the shared picker, then one of its teams
// (GET /exposure/events/division-teams?eventId=), by division.
function TournamentTeamField({ teamId, onTeam, error }: TeamFieldProps) {
  const { event, setEvent, noEvents } = useSelectedEvent();
  const eventId = event?.id ?? "";
  const [loaded, setLoaded] = useState<{ eventId: string; event: TreeEvent | null } | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiCall<DivisionTeamsTreeResponse>({
      endpoint: routes.api.exposureEventsDivisionTeams,
      method: "GET",
      data: { eventId, page: 1, limit: 1 },
    }).then((result) => {
      if (!cancelled) setLoaded({ eventId, event: result.success ? (result.data?.data?.[0]?.events?.[0] ?? null) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const loading = !noEvents && (!eventId || loaded?.eventId !== eventId);
  const tree = loading ? null : (loaded?.event ?? null);
  const teams = tree
    ? [
        ...tree.divisions.flatMap((d) => d.teams.map((t) => ({ id: t.id, name: t.name, division: d.name }))),
        ...(tree.unassigned?.teams ?? []).map((t) => ({ id: t.id, name: t.name, division: "No Division" })),
      ]
    : [];

  return (
    <div className="flex flex-col gap-3">
      <EventSelect
        value={eventId}
        onChange={(id, name) => setEvent(id ? { id, name } : null)}
        allowAll={false}
        selectedName={event?.name}
      />
      <Select
        variant="dark"
        label="Team"
        name="teamId"
        required
        value={teamId}
        onChange={(e) => {
          const team = teams.find((t) => t.id === e.target.value);
          if (team) onTeam({ id: team.id, name: team.name });
        }}
        options={teams.map((t) => ({ label: `${t.name} · ${t.division}`, value: t.id }))}
        placeholder={loading ? "Loading…" : noEvents ? "Pick an event first" : teams.length ? "Choose a team" : "No teams yet"}
        icon={<Users className="size-5" strokeWidth={2} />}
        disabled={loading || teams.length === 0}
        error={error}
        labelClassName="text-white text-sm"
      />
    </div>
  );
}

// One of the school's own teams (its sport departments), by schoolTeamId.
function SchoolTeamField({ teamId, onTeam, error }: TeamFieldProps) {
  const { teams, loading } = useOrgTeams();
  return (
    <Select
      variant="dark"
      label="Team"
      name="teamId"
      required
      value={teamId}
      onChange={(e) => {
        const team = teams.find((t) => t.id === e.target.value);
        if (team) onTeam({ id: team.id, name: team.name, sport: team.sport || undefined });
      }}
      options={teams.map((t) => ({ label: `${t.name} · ${t.sport} · ${t.level}`, value: t.id }))}
      placeholder={loading ? "Loading…" : teams.length ? "Choose a team" : "No teams yet"}
      icon={<Users className="size-5" strokeWidth={2} />}
      disabled={loading || teams.length === 0}
      error={error}
      labelClassName="text-white text-sm"
    />
  );
}

// The team of a "Profile" template (no game to take it from): a tournament event team, or a school team.
export default function TeamField({ isTournament, ...props }: TeamFieldProps & { isTournament: boolean }) {
  return isTournament ? <TournamentTeamField {...props} /> : <SchoolTeamField {...props} />;
}
