"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import Loader from "@/components/common/loader";
import SearchInput from "@/components/common/search-input";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { ExposureEvent, ExposureEventsResponse, ExposureGame, ExposureListResponse } from "@/utils/types/exposure-event";
import type { TicketGamesPage, TicketScheduleGame } from "@/utils/types/tickets";

const EVENTS_PAGE_SIZE = 20;
// The API caps the games page at 100; an event rarely has more.
const GAMES_PAGE_SIZE = 100;
const SEARCH_DELAY_MS = 300;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Clickable rows (radio / checkbox + text): native <button>s, not action buttons.
const ROW =
  "cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F6F8] transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent";
const BOX = "rounded-[12px] overflow-hidden border border-[rgba(11,28,45,0.12)] divide-y divide-[rgba(11,28,45,0.08)] bg-white";
const LABEL = "text-sm font-medium text-midnight-navy";

export interface PickedEvent {
  id: string;
  name: string;
}

interface EventGamePickerProps {
  // The campaign's event: a tournament campaign belongs to one event.
  event: PickedEvent | null;
  onEventChange: (event: PickedEvent | null) => void;
  // Editing: the campaign's event can't change, only its games.
  eventLocked?: boolean;
  // The campaign being edited, so its own games stay pickable.
  campaignId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  eventError?: string;
}

// Step 1: the tournament's events (GET /exposure/events, newest first, searchable, 20 at a time).
function EventList({ onPick }: { onPick: (event: PickedEvent) => void }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<ExposureEvent[]>([]);
  const [isLast, setIsLast] = useState(true);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [query]);

  const key = `${page}|${search}`;
  useEffect(() => {
    let cancelled = false;
    apiCall<ExposureEventsResponse>({
      endpoint: routes.api.listExposureEvents,
      method: "GET",
      data: { page, limit: EVENTS_PAGE_SIZE, ...(search && { search }) },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      setEvents((prev) => (page === 1 ? (body?.items ?? []) : [...prev, ...(body?.items ?? [])]));
      setIsLast(body ? body.pagination.isLast : true);
      setLoadedKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [key, page, search]);

  const loading = loadedKey !== key;

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        placeholder="Search events..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        aria-label="Search events"
      />
      <div className={cn(BOX, "max-h-72 overflow-y-auto")}>
        {loading && page === 1 ? (
          <Loader className="m-6" />
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-midnight-navy/60">{search ? "No events match your search." : "No events synced yet."}</p>
        ) : (
          events.map((e) => (
            <button key={e.id} type="button" onClick={() => onPick({ id: e.id, name: e.name })} className={ROW}>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-midnight-navy break-words">{e.name}</span>
                <span className="text-xs text-midnight-navy/60">
                  {[fmtDate(e.startDate), [e.city, e.state].filter(Boolean).join(", "), `${e.gameCount} games`].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      {!isLast && events.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          label={loading ? "Loading…" : "Load more events"}
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="self-center"
        />
      )}
    </div>
  );
}

// A game of the event, with what the tickets API knows of it (campaign), when it knows.
type EventGame = ExposureGame & { campaign: TicketScheduleGame["campaign"] };

// Step 2: the picked event's games. The list comes from GET /exposure/events/{id}/games (its ids are
// the tickets API's game ids); GET /tickets/games?eventId= adds each game's campaign. That filter isn't
// honoured by the API yet (it answers the org's games), so only rows whose ids match are joined.
function EventGames({ eventId, campaignId, selected, onChange }: { eventId: string; campaignId?: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const [loaded, setLoaded] = useState<{ eventId: string; games: EventGame[]; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiCall<ExposureListResponse<ExposureGame>>({ endpoint: routes.api.exposureEventGames(eventId), method: "GET" }),
      apiCall<{ data: TicketGamesPage[] }>({
        endpoint: routes.api.ticketGames,
        method: "GET",
        data: { eventId, page: 1, limit: GAMES_PAGE_SIZE, status: "all" },
      }),
    ]).then(([games, tickets]) => {
      if (cancelled) return;
      const campaignOf = new Map((tickets.success ? (tickets.data?.data?.[0]?.items ?? []) : []).map((g) => [g.id, g.campaign]));
      setLoaded({
        eventId,
        games: (games.success ? (games.data?.data ?? []) : []).map((g) => ({ ...g, campaign: campaignOf.get(g.id) ?? null })),
        at: Date.now(),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loaded?.eventId !== eventId) return <Loader className="m-6" />;
  const games = [...loaded.games].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Why a game can't be picked: it sells through another active campaign, or it has started.
  const blockedBy = (g: EventGame) =>
    g.campaign && g.campaign.status === "ACTIVE" && g.campaign.id !== campaignId
      ? `In ${g.campaign.title}`
      : new Date(g.start).getTime() <= loaded.at && !selected.includes(g.id)
        ? "Ended"
        : null;
  const pickable = games.filter((g) => !blockedBy(g));
  const allPicked = pickable.length > 0 && pickable.every((g) => selected.includes(g.id));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  if (games.length === 0) return <p className="p-4 text-sm text-midnight-navy/60">No games synced for this event.</p>;
  return (
    <>
      <button type="button" onClick={() => onChange(allPicked ? [] : pickable.map((g) => g.id))} disabled={pickable.length === 0} className={ROW}>
        <Checkbox checked={allPicked} indeterminate={selected.length > 0 && !allPicked} />
        <span className="text-sm font-semibold text-midnight-navy">{`Select all (${pickable.length})`}</span>
      </button>
      {games.map((g) => {
        const blocked = blockedBy(g);
        return (
          <button key={g.id} type="button" onClick={() => toggle(g.id)} disabled={!!blocked} className={ROW}>
            <Checkbox checked={selected.includes(g.id)} />
            <span className="flex flex-col min-w-0">
              <span className="text-sm text-midnight-navy break-words">{g.title || (g.opponent ? `vs ${g.opponent}` : "Game")}</span>
              <span className="text-xs text-midnight-navy/60">
                {[fmtWhen(g.start), g.location, g.sports, blocked].filter(Boolean).join(" · ")}
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}

// Tournament version of the campaign's games: pick one event first, then games of that event (a
// tournament campaign belongs to a single event). Editing keeps the campaign's event.
export default function EventGamePicker({
  event,
  onEventChange,
  eventLocked = false,
  campaignId,
  selected,
  onChange,
  eventError,
}: EventGamePickerProps) {
  return (
    <div className="w-full shrink-0 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className={LABEL}>
          Event<span className="text-error"> *</span>
        </span>
        {event ? (
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(11,28,45,0.12)] bg-[#F5F6F8] px-4 py-3">
            <span className="flex items-center gap-2 min-w-0">
              <Check className="size-4 shrink-0 text-success" strokeWidth={3} />
              <span className="text-sm font-semibold text-midnight-navy break-words">{event.name}</span>
            </span>
            {!eventLocked && (
              <Button
                variant="text"
                size="sm"
                label="Change"
                onClick={() => {
                  onEventChange(null);
                  // Games belong to one event, so a new event starts with none picked.
                  onChange([]);
                }}
                className="shrink-0 text-steel-blue"
              />
            )}
          </div>
        ) : (
          <EventList onPick={onEventChange} />
        )}
        {eventError && <p className="text-sm text-error">{eventError}</p>}
      </div>

      {event && (
        <div className="flex flex-col gap-2">
          <span className={LABEL}>Games</span>
          <div className={BOX}>
            <EventGames eventId={event.id} campaignId={campaignId} selected={selected} onChange={onChange} />
          </div>
          {selected.length > 0 && <span className="text-xs text-midnight-navy/60">{`${selected.length} games selected`}</span>}
        </div>
      )}
    </div>
  );
}
