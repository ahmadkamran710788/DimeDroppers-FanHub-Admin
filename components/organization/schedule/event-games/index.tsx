"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Users } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type {
  DivisionTeamsTreeResponse,
  TournamentScheduleGame,
  TournamentScheduleResponse,
  TreeTeam,
} from "@/utils/types/exposure-event";

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const COLUMNS = [
  { label: "GAME", cls: "flex-1 min-w-[220px]" },
  { label: "DATE & TIME", cls: "w-56" },
  { label: "LOCATION", cls: "w-56" },
  { label: "RESULT", cls: "w-28 justify-center" },
];

// Teams with no division are offered under this pseudo-division.
const NO_DIVISION = "no-division";

interface DivisionOption {
  id: string;
  name: string;
  teams: TreeTeam[];
}

interface Loaded {
  eventId: string;
  divisions: DivisionOption[];
}

// The API caps a page at 100; one team rarely plays more in an event.
const GAMES_LIMIT = 100;

// The final score from the picked team's side: "W 34–8" / "L 7–37" / "T 10–10".
function teamResult(g: TournamentScheduleGame, teamId: string): string {
  if (!g.finalScore) return g.result ?? "—";
  const isHome = g.home.teamId === teamId;
  const [mine, theirs] = isHome ? [g.finalScore.home, g.finalScore.away] : [g.finalScore.away, g.finalScore.home];
  return `${mine > theirs ? "W" : mine < theirs ? "L" : "T"} ${mine}–${theirs}`;
}

interface EventGamesProps {
  eventId: string;
  eventName: string;
}

// Schedule → Events with one event picked at the top: pick a division of the event, then one of its
// teams, to see that team's games. The divisions and
// teams from GET /exposure/events/division-teams?eventId=; the team's games from GET
// /exposure/schedules?eventId&divisionId&teamId.
export default function EventGames({ eventId, eventName }: EventGamesProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [divisionId, setDivisionId] = useState("");
  const [teamId, setTeamId] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiCall<DivisionTeamsTreeResponse>({
      endpoint: routes.api.exposureEventsDivisionTeams,
      method: "GET",
      data: { eventId, page: 1, limit: 1 },
    }).then((tree) => {
      if (cancelled) return;
      const event = tree.success ? tree.data?.data?.[0]?.events?.[0] : undefined;
      const divisions: DivisionOption[] = [...(event?.divisions ?? [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
        .map((d) => ({ id: d.id, name: d.name, teams: d.teams }));
      if (event?.unassigned?.teams.length) divisions.push({ id: NO_DIVISION, name: "No Division", teams: event.unassigned.teams });
      setLoaded({ eventId, divisions });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // The picked team's games, from GET /exposure/schedules (keyed so a stale answer isn't shown).
  const gamesKey = teamId ? `${eventId}|${divisionId}|${teamId}` : "";
  const [teamGames, setTeamGames] = useState<{ key: string; games: TournamentScheduleGame[] } | null>(null);
  useEffect(() => {
    if (!gamesKey) return;
    let cancelled = false;
    apiCall<TournamentScheduleResponse>({
      endpoint: routes.api.exposureSchedules,
      method: "GET",
      data: { eventId, ...(divisionId !== NO_DIVISION && { divisionId }), teamId, page: 1, limit: GAMES_LIMIT },
    }).then((result) => {
      if (cancelled) return;
      setTeamGames({ key: gamesKey, games: result.success ? (result.data?.data?.[0]?.items ?? []) : [] });
    });
    return () => {
      cancelled = true;
    };
  }, [gamesKey, eventId, divisionId, teamId]);

  const loading = loaded?.eventId !== eventId;
  const divisions = loading ? [] : (loaded?.divisions ?? []);
  const division = divisions.find((d) => d.id === divisionId);
  const team = division?.teams.find((t) => t.id === teamId);
  const gamesLoading = !!team && teamGames?.key !== gamesKey;
  const games = !team || gamesLoading
    ? []
    : [...(teamGames?.games ?? [])].sort((a, b) => new Date(a.utcTime || a.start).getTime() - new Date(b.utcTime || b.start).getTime());

  return (
    <div className="flex flex-col gap-5">
      <span className="text-white text-3xl font-extrabold font-display uppercase truncate">{eventName || "Event"}</span>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
        </div>
      ) : (
        <>
          {/* Division, then team */}
          <div className="flex flex-wrap items-center gap-3">
            {divisions.length === 0 ? (
              <span className="h-11 px-5 rounded-full bg-white/10 flex items-center text-sm text-white/60">No divisions available</span>
            ) : (
              <FilterDropdown
                label="Select division"
                icon={<Layers className="w-5 h-5" strokeWidth={1.5} />}
                options={divisions.map((d) => ({ label: `${d.name} (${d.teams.length})`, value: d.id }))}
                value={divisionId}
                onChange={(id) => {
                  setDivisionId(id);
                  // The division's first team opens straight away.
                  setTeamId(divisions.find((d) => d.id === id)?.teams[0]?.id ?? "");
                }}
              />
            )}
            {division &&
              (division.teams.length === 0 ? (
                <span className="h-11 px-5 rounded-full bg-white/10 flex items-center text-sm text-white/60">No teams available</span>
              ) : (
                <FilterDropdown
                  label="Select team"
                  icon={<Users className="w-5 h-5" strokeWidth={1.5} />}
                  options={division.teams.map((t) => ({ label: t.name, value: t.id }))}
                  value={teamId}
                  onChange={setTeamId}
                />
              ))}
          </div>

          {/* The team's games */}
          {!team ? (
            <p className="py-10 text-center text-sm text-white/50">
              {divisions.length === 0
                ? "This event has no divisions yet."
                : !division
                  ? "Select a division to see its teams."
                  : division.teams.length === 0
                    ? "This division has no teams yet."
                    : "Select a team to see its games."}
            </p>
          ) : (
            <div className="flex flex-col">
              <span className="text-white text-xl font-extrabold font-display uppercase mb-3">{gamesLoading ? `${team.name} Games` : `${team.name} Games (${games.length})`}</span>
              <div className="overflow-x-auto">
                <div className="flex items-center border-b border-white/20">
                  {COLUMNS.map(({ label, cls }) => (
                    <div key={label} className={cn("h-10 px-2 bg-white/10 flex items-center", cls)}>
                      <span className="text-white text-xs font-semibold uppercase leading-4">{label}</span>
                    </div>
                  ))}
                </div>
                {gamesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                  </div>
                ) : games.length === 0 ? (
                  <div className="flex justify-center items-center py-12 text-white/40 text-sm">No games available for this team.</div>
                ) : (
                  games.map((g) => (
                    <div key={g.id} className="flex items-center border-b border-white/10 text-sm text-white">
                      <div className={cn("px-2 py-4 flex flex-col gap-0.5 min-w-0", COLUMNS[0].cls)}>
                        <span className="font-semibold break-words">
                          {`${g.home.teamName ?? "TBD"} vs ${g.away.teamName ?? "TBD"}`}
                        </span>
                        {g.division?.name && <span className="text-xs text-white/50">{g.division.name}</span>}
                      </div>
                      <div className={cn("px-2 py-4", COLUMNS[1].cls)}>{fmtWhen(g.utcTime || g.start)}</div>
                      <div className={cn("px-2 py-4 break-words text-white/80", COLUMNS[2].cls)}>{g.location ?? "—"}</div>
                      <div className={cn("px-2 py-4 flex whitespace-nowrap", COLUMNS[3].cls)}>{teamResult(g, teamId)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
