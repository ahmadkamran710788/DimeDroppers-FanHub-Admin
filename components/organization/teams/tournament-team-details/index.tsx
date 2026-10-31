"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Column } from "@/components/common/generic-table";
import Loader from "@/components/common/loader";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import PeopleList from "@/components/organization/teams/team-details/people-list";
import PersonCell from "@/components/organization/teams/team-details/person-cell";
import TeamRolesTab from "@/components/organization/teams/tournament-team-details/team-roles-tab";
import { useTeamRoles } from "@/components/organization/teams/tournament-team-details/use-team-roles";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type {
  DivisionTeamsTreeResponse,
  ExposureGame,
  ExposureListResponse,
  ExposurePlayer,
  TreeTeam,
} from "@/utils/types/exposure-event";

const TABS = ["Players", "Parents", "Staff", "Followers", "Stats", "Schedule"] as const;
type Tab = (typeof TABS)[number];

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");
const fullName = (p: ExposurePlayer) => [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed player";
// The result from the team's side: "W 34–8" / "L 7–37" / "T 10–10". The title's first side is taken
// to own the first score; anything else is shown as sent.
function teamResult(game: ExposureGame, teamName: string): string {
  const score = game.result?.match(/^\s*(\d+)\s*[-–]\s*(\d+)\s*$/);
  if (!score) return game.result ?? "—";
  const first = (game.title ?? "").split(/\s+vs\.?\s+/i)[0]?.trim().toLowerCase();
  const [a, b] = [Number(score[1]), Number(score[2])];
  const [mine, theirs] = first === teamName.trim().toLowerCase() ? [a, b] : [b, a];
  return `${mine > theirs ? "W" : mine < theirs ? "L" : "T"} ${mine}–${theirs}`;
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const PLAYER_COLUMNS: Column<ExposurePlayer>[] = [
  { header: "Player", cls: "flex-1 min-w-[200px] py-5", cell: (p) => <PersonCell name={fullName(p)} email={p.email ?? ""} /> },
  { header: "Position", cls: "w-24 shrink-0 py-5", cell: (p) => dash(p.position) },
  { header: "Grade", cls: "w-20 shrink-0 py-5", cell: (p) => dash(p.grade) },
  { header: "Grad Yr", cls: "w-20 shrink-0 py-5", cell: (p) => dash(p.graduationYear) },
  { header: "Height", cls: "w-20 shrink-0 py-5", cell: (p) => dash(p.height) },
  { header: "School", cls: "w-44 shrink-0 py-5", cell: (p) => <span className="leading-5">{dash(p.playerSchool)}</span> },
];
const playerSearch = (p: ExposurePlayer) => [fullName(p), p.email ?? "", p.position ?? "", p.playerSchool ?? ""];

interface TeamInfo {
  team: TreeTeam;
  eventName: string;
  divisionName: string | null;
}

interface Loaded {
  info: TeamInfo | null;
  players: ExposurePlayer[];
  games: ExposureGame[];
}

// A tournament team's page (an Exposure team of one event), laid out like a school team's: header and
// Players / Parents / Staff / Followers tabs, plus Stats and Schedule. Players come from GET
// /exposure/teams/{id}/players; the schedule is the event's games in the team's division with the team
// on one side. Staff and Parents are the team-roles invitations and members. The followers list and
// stats have no tournament API yet.
export default function TournamentTeamDetails({ eventId, teamId }: { eventId: string; teamId: string }) {
  const { savedSchool } = useSetup();
  const [tab, setTab] = useState<Tab>("Players");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const roles = useTeamRoles(teamId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiCall<DivisionTeamsTreeResponse>({
        endpoint: routes.api.exposureEventsDivisionTeams,
        method: "GET",
        data: { eventId, page: 1, limit: 1 },
      }),
      apiCall<ExposureListResponse<ExposurePlayer>>({ endpoint: routes.api.exposureTeamPlayers(teamId), method: "GET" }),
      apiCall<ExposureListResponse<ExposureGame>>({ endpoint: routes.api.exposureEventGames(eventId), method: "GET" }),
    ]).then(([tree, players, games]) => {
      if (cancelled) return;
      const event = tree.success ? tree.data?.data?.[0]?.events?.[0] : undefined;
      let info: TeamInfo | null = null;
      for (const d of event?.divisions ?? []) {
        const team = d.teams.find((t) => t.id === teamId);
        if (team) info = { team, eventName: event!.name, divisionName: d.name };
      }
      const loose = event?.unassigned?.teams.find((t) => t.id === teamId);
      if (!info && loose && event) info = { team: loose, eventName: event.name, divisionName: null };
      setLoaded({
        info,
        players: players.success ? (players.data?.data ?? []) : [],
        games: games.success ? (games.data?.data ?? []) : [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, teamId]);

  const back = (
    <Link
      href={routes.ui.teams}
      className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
    >
      <ArrowLeft className="size-6" strokeWidth={1.5} />
      Back to Teams
    </Link>
  );

  if (!loaded || !loaded.info) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        {loaded ? <p className="py-16 text-center text-sm text-white/60">This team could not be found.</p> : <Loader />}
      </div>
    );
  }

  const { team, eventName, divisionName } = loaded.info;
  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  // The team's games: in its division (a game's `sports` is its division name) with the team on one
  // side of its "A vs B" title or as the opponent. Games carry no team id.
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  const name = norm(team.name);
  const games = loaded.games
    .filter((g) => (divisionName === null || norm(g.sports) === norm(divisionName)) &&
      [...(g.title ?? "").split(/\s+vs\.?\s+/i), g.opponent ?? ""].map(norm).includes(name))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const meta = [
    divisionName,
    team.pool && `Pool ${team.pool}`,
    team.grade && `Grade ${team.grade}`,
    team.age,
    team.gender && team.gender !== "unspecified" ? team.gender : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      {back}

      {/* Team header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Image
          src={crest}
          alt=""
          width={80}
          height={80}
          unoptimized={crest.startsWith("http")}
          className="size-20 shrink-0 rounded-full object-cover bg-black/40 p-1 border-2 border-white/60"
        />
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display font-black text-[32px] sm:text-[40px] uppercase text-white leading-none">{team.name}</h2>
            <StatusPill label="Active" color="bg-success" />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/75">
            <span>{eventName}</span>
            {meta.map((m) => (
              <span key={m as string} className="capitalize">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Players: loaded.players.length, Followers: team.followerCount, Schedule: games.length }} />
        {tab === "Players" ? (
          <PeopleList
            key={tab}
            rows={loaded.players}
            columns={PLAYER_COLUMNS}
            getKey={(p) => p.id}
            searchFields={playerSearch}
            noun="players"
          />
        ) : tab === "Parents" ? (
          <TeamRolesTab kind="parent" fanHubTeamId={teamId} players={loaded.players} {...roles} />
        ) : tab === "Staff" ? (
          <TeamRolesTab kind="staff" fanHubTeamId={teamId} players={loaded.players} {...roles} />
        ) : tab === "Followers" ? (
          <p className="py-16 text-center text-sm text-white/60">
            {`${team.followerCount} ${team.followerCount === 1 ? "fan follows" : "fans follow"} this team. The list of followers is not available for tournament teams yet.`}
          </p>
        ) : tab === "Stats" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Games", value: games.length },
              { label: "Played", value: games.filter((g) => g.result).length },
              { label: "Followers", value: team.followerCount },
              { label: "Players", value: loaded.players.length },
            ].map((s) => (
              <div key={s.label} className="rounded-[8px] p-4 bg-white/5 border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-white/60 uppercase">{s.label}</span>
                <span className="font-display font-black text-3xl text-white leading-none">{s.value}</span>
              </div>
            ))}
            <p className="col-span-full text-xs text-white/50">
              From this event&apos;s synced games. Player and game stats aren&apos;t available for tournament teams yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center border-b border-white/20">
              {["GAME", "DATE & TIME", "LOCATION", "RESULT"].map((label, i) => (
                <div key={label} className={cn("h-10 px-2 bg-white/10 flex items-center", ["flex-1 min-w-[220px]", "w-56", "w-56", "w-28 justify-center"][i])}>
                  <span className="text-white text-xs font-semibold uppercase leading-4">{label}</span>
                </div>
              ))}
            </div>
            {games.length === 0 ? (
              <div className="flex justify-center items-center py-12 text-white/40 text-sm">No games available for this team.</div>
            ) : (
              games.map((g) => (
                <div key={g.id} className="flex items-center border-b border-white/10 text-sm text-white">
                  <div className="flex-1 min-w-[220px] px-2 py-4 font-semibold break-words">{g.title || (g.opponent ? `vs ${g.opponent}` : "Game")}</div>
                  <div className="w-56 px-2 py-4">{fmtWhen(g.start)}</div>
                  <div className="w-56 px-2 py-4 break-words text-white/80">{g.location ?? "—"}</div>
                  <div className="w-28 px-2 py-4 flex justify-center whitespace-nowrap">{teamResult(g, team.name)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
