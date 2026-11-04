"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Loader from "@/components/common/loader";
import SearchInput from "@/components/common/search-input";
import TeamAvatar from "@/components/common/team-avatar";
import EventSelect from "@/components/organization/event-select";
import type { ChatTeam } from "@/components/organization/messages/types";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { DivisionTeamsTreeResponse, TreeEvent } from "@/utils/types/exposure-event";

// Clickable team rows (crest, two lines of text): native <button>s, not action buttons.
const ROW = "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors";

interface TeamPickerProps {
  onPick: (team: ChatTeam) => void;
}

function Row({ onClick, avatar, title, subtitle }: { onClick: () => void; avatar: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button type="button" onClick={onClick} className={ROW}>
      {avatar}
      <span className="flex-1 flex flex-col min-w-0">
        <span className="text-sm font-semibold text-white truncate">{title}</span>
        <span className="text-xs text-white/50 truncate">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 text-white/50" />
    </button>
  );
}

// A school's own teams (its sport departments).
function SchoolTeams({ onPick }: TeamPickerProps) {
  const { savedSchool } = useSetup();
  const { teams, loading } = useOrgTeams();
  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  if (loading) return <Loader />;
  if (teams.length === 0) return <p className="py-12 text-center text-sm text-white/50">No teams yet. Add a team to message its people.</p>;
  return (
    <>
      {teams.map((t) => (
        <Row
          key={t.id}
          onClick={() => onPick({ id: t.id, name: t.name, kind: "SCHOOL_TEAM" })}
          avatar={
            <Image
              src={crest}
              alt=""
              width={40}
              height={40}
              // The school logo may be an uploaded remote URL with no configured image host.
              unoptimized={crest.startsWith("http")}
              className="size-10 shrink-0 rounded-full object-cover bg-black/40 p-0.5 border-2"
              style={{ borderColor: t.ring }}
            />
          }
          title={t.name}
          subtitle={`${t.sport} · ${t.level}`}
        />
      ))}
    </>
  );
}

// A tournament's event teams: the event from the shared picker, then its teams by division
// (GET /exposure/events/division-teams?eventId=), searchable by name.
function TournamentTeams({ onPick }: TeamPickerProps) {
  const { event, setEvent, noEvents } = useSelectedEvent();
  const eventId = event?.id ?? "";
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
      if (!cancelled) setLoaded({ eventId, event: result.success ? (result.data?.data?.[0]?.events?.[0] ?? null) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const loading = !noEvents && (!eventId || loaded?.eventId !== eventId);
  const tree = loading ? null : (loaded?.event ?? null);
  const q = query.trim().toLowerCase();
  const groups = tree
    ? [
        ...[...tree.divisions]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
          .map((d) => ({ name: d.name, teams: d.teams })),
        ...(tree.unassigned?.teams.length ? [{ name: "No Division", teams: tree.unassigned.teams }] : []),
      ]
        .map((g) => ({ ...g, teams: g.teams.filter((t) => !q || t.name.toLowerCase().includes(q)) }))
        .filter((g) => g.teams.length > 0)
    : [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <EventSelect
          value={eventId}
          onChange={(id, name) => setEvent(id ? { id, name } : null)}
          allowAll={false}
          selectedName={event?.name}
        />
        <SearchInput variant="dark" placeholder="Search teams" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11" />
      </div>
      {noEvents ? (
        <p className="py-12 text-center text-sm text-white/50">Pick an event to see its teams.</p>
      ) : loading ? (
        <Loader />
      ) : groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/50">{q ? "No teams match your search." : "This event has no teams yet."}</p>
      ) : (
        groups.map((g) => (
          <div key={g.name} className="flex flex-col gap-2">
            <span className="px-1 text-xs font-semibold uppercase text-white/50">{g.name}</span>
            {g.teams.map((t) => (
              <Row
                key={t.id}
                onClick={() => onPick({ id: t.id, name: t.name, kind: "FANHUB_TEAM" })}
                avatar={<TeamAvatar name={t.name} size={40} className="size-10 shrink-0" />}
                title={t.name}
                subtitle={[tree?.name, g.name].filter(Boolean).join(" · ")}
              />
            ))}
          </div>
        ))
      )}
    </>
  );
}

// "Choose a Team" for a new message: a school's teams, or a tournament's event teams.
export default function TeamPicker({ onPick }: TeamPickerProps) {
  const { org } = useAuth();
  return orgKindOf(org) === "tournament" ? <TournamentTeams onPick={onPick} /> : <SchoolTeams onPick={onPick} />;
}
