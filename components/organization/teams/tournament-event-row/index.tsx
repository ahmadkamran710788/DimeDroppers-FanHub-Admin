"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Heart, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TreeEvent, TreeTeam } from "@/utils/types/exposure-event";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const dates = (e: TreeEvent) => (e.endDate && e.endDate !== e.startDate ? `${fmtDate(e.startDate)} – ${fmtDate(e.endDate)}` : fmtDate(e.startDate));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface DivisionGroup {
  id: string;
  name: string;
  teamCount: number;
  teams: TreeTeam[];
}

// One team: name, pool / grade / age / gender, with its player and follower counts. With `href` the
// row opens the team's page.
export function TeamRow({ team, href }: { team: TreeTeam; href?: string }) {
  const meta = [team.pool && `Pool ${team.pool}`, team.grade, team.age, team.gender && team.gender !== "unspecified" && team.gender]
    .filter(Boolean)
    .join(" · ");
  const body = (
    <>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-white break-words">{team.name}</span>
        {meta && <span className="text-xs text-white/50 capitalize">{meta}</span>}
      </div>
      <div className="shrink-0 flex items-center gap-4 text-xs text-white/60">
        <span className="flex items-center gap-1.5">
          <Users className="size-4" strokeWidth={1.5} />
          {plural(team.playerCount, "player", "players")}
        </span>
        <span className="flex items-center gap-1.5">
          <Heart className="size-4" strokeWidth={1.5} />
          {plural(team.followerCount, "follower", "followers")}
        </span>
        {href && <ChevronRight className="size-4" />}
      </div>
    </>
  );
  const row = "flex items-center justify-between gap-3 px-4 py-3";
  return (
    <li className="border-b border-white/10 last:border-b-0">
      {href ? (
        <Link href={href} className={cn(row, "hover:bg-white/5 transition-colors")}>
          {body}
        </Link>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}

interface DivisionRowProps {
  division: DivisionGroup;
  // Each team row links here when set.
  teamHref?: (team: TreeTeam) => string;
  defaultOpen: boolean;
  // Set by the page's accordion: whether this is the event's open division, and the toggle.
  open?: boolean;
  onToggle?: () => void;
}

// Second layer: one division, opening to its teams.
export function DivisionRow({ division, teamHref, defaultOpen, open: openProp, onToggle }: DivisionRowProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = openProp ?? localOpen;
  return (
    <div className="rounded-[8px] border border-white/10 overflow-hidden">
      {/* Clickable row (not an action button): opens the division's teams. */}
      <button
        type="button"
        onClick={onToggle ?? (() => setLocalOpen((v) => !v))}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-white">{division.name}</span>
        <span className="flex items-center gap-2 text-xs text-white/60">
          {plural(division.teamCount, "team", "teams")}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open &&
        (division.teams.length === 0 ? (
          <p className="px-4 py-3 text-sm text-white/50">No teams in this division.</p>
        ) : (
          <ul>
            {division.teams.map((t) => (
              <TeamRow key={t.id} team={t} href={teamHref?.(t)} />
            ))}
          </ul>
        ))}
    </div>
  );
}

// The page's accordion while browsing: one event open at a time, and one of its divisions.
interface EventAccordion {
  open: boolean;
  openDivisionId: string | null;
  onToggle: () => void;
  onToggleDivision: (division: DivisionGroup) => void;
}

interface TournamentEventRowProps {
  event: TreeEvent;
  // Open the event (and its divisions with teams) straight away, e.g. while a team search is on.
  defaultOpen?: boolean;
  // Hands which event and division are open to the page; without it each one toggles on its own.
  accordion?: EventAccordion;
}

// First layer: one tournament event with its divisions and their teams, all from the division-teams
// API (no extra calls). Teams without a division show last, as "No Division".
export default function TournamentEventRow({ event, defaultOpen = false, accordion }: TournamentEventRowProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = accordion ? accordion.open : localOpen;

  const divisions: DivisionGroup[] = [...event.divisions]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
    .map((d) => ({ id: d.id, name: d.name, teamCount: d.teamCount, teams: d.teams }));
  if (event.unassigned?.teamCount) {
    divisions.push({ id: "no-division", name: "No Division", teamCount: event.unassigned.teamCount, teams: event.unassigned.teams });
  }
  // While searching, only divisions with a matching team are worth showing.
  const shown = defaultOpen ? divisions.filter((d) => d.teams.length > 0) : divisions;

  return (
    <li className="rounded-[8px] border border-white/10 bg-white/5 overflow-hidden">
      {/* Clickable row (not an action button): opens the event's divisions. */}
      <button
        type="button"
        onClick={accordion ? accordion.onToggle : () => setLocalOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-base font-semibold text-white break-words">{event.name}</span>
          <span className="text-xs text-white/60">
            {[dates(event), [event.city, event.state].filter(Boolean).join(", "), event.sport].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span className="shrink-0 flex items-center gap-3 text-xs text-white/70">
          <span>{plural(event.divisionCount, "division", "divisions")}</span>
          <span>{plural(event.teamCount, "team", "teams")}</span>
          <ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {shown.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/50">No divisions or teams synced for this event.</p>
          ) : (
            shown.map((d) => (
              <DivisionRow
                key={d.id}
                division={d}
                defaultOpen={defaultOpen}
                open={accordion ? accordion.openDivisionId === d.id : undefined}
                onToggle={accordion ? () => accordion.onToggleDivision(d) : undefined}
              />
            ))
          )}
        </div>
      )}
    </li>
  );
}
