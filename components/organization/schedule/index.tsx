"use client";

import Image from "next/image";
import AddGameModal from "@/components/organization/schedule/add-game-modal";
import DeleteGameModal from "@/components/organization/schedule/delete-game-modal";
import GameDetailsPanel from "@/components/organization/schedule/game-details-panel";
import ExposureEventModal from "@/components/organization/schedule/exposure-event-modal";
import { formatTime, parseGameDate } from "@/components/organization/schedule/game-date";
import TeamSide from "@/components/organization/schedule/team-side";
import Button from "@/components/common/button";
import RowActionsMenu from "@/components/common/row-actions-menu";
import { useRouter } from "next/navigation";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import FilterDropdown from "@/components/common/filter-dropdown";
import {
  SCHEDULE_DIVISION_FILTERS,
  SCHEDULE_GENDER_FILTERS,
  SCHEDULE_LEVEL_FILTERS,
  SCHEDULE_SEASON_FILTERS,
  SCHEDULE_VENUE_FILTERS,
  SCHEDULE_VIEW_FILTERS,
  SPORTS_OPTIONS,
} from "@/utils/constants/schedule";
import type { ScheduleItem, ScheduleListResponse, SchedulePagination, ScheduleSummary } from "@/utils/types/schedule";
import DateField from "@/components/common/date-field";
import Pagination from "@/components/common/pagination";
import EventSelect from "@/components/organization/event-select";
import { useSelectedEvent } from "@/context/selected-event";
import EventGames from "@/components/organization/schedule/event-games";
import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import type { ExposureEvent, ExposureEventsResponse, ExposureEventView } from "@/utils/types/exposure-event";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Loader2,
  Plus,
  Search,
  Play,
  ChartNoAxesColumn,
  Users,
  MapPin,
  Trophy,
  CalendarPlus,
  Copy,
  Download,
  Printer,
  Layers,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { orgKindOf, useAuth } from "@/context/auth";

// ─── Constants ────────────────────────────────────────────────────────────────

// A school schedules its own games; a tournament's games come in as synced events.
const SCHOOL_TABS = ["Games"];
const TOURNAMENT_TABS = ["Events"];

const SCHEDULE_TOOLS = [
  { icon: Plus, label: "Add Game", description: "Manually add a single game" },
  { icon: CalendarPlus, label: "Add Event", description: "Add a non-game event" },
  { icon: Layers, label: "Bulk Add Games", description: "Add multiple games at once" },
  { icon: Copy, label: "Duplicate Game", description: "Copy an existing game" },
  { icon: Download, label: "Export Schedule", description: "Download as CSV or PDF" },
  { icon: Printer, label: "Print Schedule", description: "Print your schedule" },
];

const DOT_COLORS: Record<string, string> = {
  home: "bg-green-400",
  away: "bg-violet-500",
  neutral: "bg-teal-400",
  event: "bg-orange-400",
  completed: "bg-white/30",
};

const LEGEND = [
  { label: "Home", color: "bg-green-400" },
  { label: "Away", color: "bg-violet-500" },
  { label: "Neutral", color: "bg-teal-400" },
  { label: "Event", color: "bg-orange-400" },
  { label: "Completed", color: "bg-white/30" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatNextGameDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function buildCalendarDots(games: ScheduleItem[]): Record<number, string[]> {
  const dots: Record<number, string[]> = {};
  for (const g of games) {
    const d = new Date(g.start);
    if (isNaN(d.getTime())) continue;
    const day = d.getDate();
    const type = g.status === "cancelled" ? "completed" : (g.homeAway ?? "neutral");
    dots[day] = [...(dots[day] ?? []), type];
  }
  return dots;
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

const EVENTS_PAGE_SIZE = 20;

// The other Events tab filters (sport / state exact match, startDate range) and the sort.
const EVENT_SORTS = [
  { value: "startDate_desc", label: "Newest first" },
  { value: "startDate_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
];
const DEFAULT_EVENT_FILTERS = { sport: "", state: "", from: "", to: "", sort: "startDate_desc" };
type EventFilters = typeof DEFAULT_EVENT_FILTERS;

// ─── Stats ────────────────────────────────────────────────────────────────────

function buildStatsFromSummary(s: ScheduleSummary) {
  return [
    { label: "Total Games", subtitle: "This Season", value: s.totalGames, color: "bg-blue-400/50" },
    { label: "Home Games", subtitle: s.totalGames ? `${s.homePercent}% of total` : "—", value: s.homeGames, color: "bg-green-400/50" },
    { label: "Away Games", subtitle: s.totalGames ? `${s.awayPercent}% of total` : "—", value: s.awayGames, color: "bg-violet-500/50" },
    { label: "Events", subtitle: s.totalGames ? `${s.eventsPercent}% of total` : "—", value: s.events, color: "bg-red-400/50" },
  ];
}

function buildStatsFromGames(games: ScheduleItem[]) {
  const total = games.length;
  const home = games.filter((g) => g.homeAway === "home").length;
  const away = games.filter((g) => g.homeAway === "away").length;
  const events = games.filter((g) => g.homeAway === null).length;
  return [
    { label: "Total Games", subtitle: "This Season", value: total, color: "bg-blue-400/50" },
    { label: "Home Games", subtitle: total ? `${Math.round((home / total) * 100)}% of total` : "—", value: home, color: "bg-green-400/50" },
    { label: "Away Games", subtitle: total ? `${Math.round((away / total) * 100)}% of total` : "—", value: away, color: "bg-violet-500/50" },
    { label: "Events", subtitle: total ? `${Math.round((events / total) * 100)}% of total` : "—", value: events, color: "bg-red-400/50" },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, subtitle, value, color }: { label: string; subtitle: string; value: number; color: string }) {
  return (
    <div className="flex-1 p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-start items-start gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-white text-3xl font-extrabold font-display uppercase">{label}</div>
          <div className="text-white text-xs font-normal leading-5">{subtitle}</div>
        </div>
        <div className={cn("size-16 relative overflow-hidden rounded-lg border-2 backdrop-blur-xl flex items-center justify-center", color)}>
          <div className="text-white text-3xl font-extrabold font-display uppercase">{value}</div>
        </div>
      </div>
    </div>
  );
}

interface GameRowProps {
  game: ScheduleItem;
  onEdit: (g: ScheduleItem) => void;
  onDelete: (g: ScheduleItem) => void;
}

function GameRow({ game, onEdit, onDelete }: GameRowProps) {
  const { day, month, weekday } = parseGameDate(game.start);
  const { time, tz } = formatTime(game.start, game.isAllDay);

  const statusColor = game.status === "cancelled" ? "bg-red-400" : game.status === "tentative" ? "bg-yellow-400" : "bg-green-400";
  const statusText = game.status === "cancelled" ? "Cancelled" : game.status === "tentative" ? "Tentative" : "Scheduled";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("flex flex-col border-b border-white/20 border-l-2", expanded ? "border-l-[#FF34BF]" : "border-l-transparent")}>
      <div className="flex justify-start items-stretch">
        {/* EXPAND — opens the game details panel under the row */}
        <div className="w-14 px-2 py-4 bg-white/5 flex justify-center items-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide game details" : "Show game details"}
            className="size-10 rounded-lg bg-white/10 outline outline-1 outline-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronDown className={cn("w-4 h-4 text-white transition-transform", expanded && "rotate-180")} strokeWidth={2} />
          </button>
        </div>
        {/* DATE */}
        <div className="flex-1 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
          <div className="px-4 py-1 bg-white/10 rounded-lg outline outline-1 outline-white/10 backdrop-blur-xl flex items-center">
            <div className="w-7 flex flex-col items-center">
              <div className="text-white text-3xl font-extrabold font-display uppercase leading-none">{day}</div>
              <div className="text-white text-xs font-bold uppercase leading-6">{month}</div>
              <div className="text-white text-xs font-bold uppercase leading-6">{weekday}</div>
            </div>
          </div>
        </div>
        {/* OPPONENT */}
        <div className="w-52 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 w-full">
            {game.opponentLogoUrl ? (
              <Image
                src={game.opponentLogoUrl}
                alt=""
                width={40}
                height={40}
                // Opponent logos come from external hosts that aren't configured for the image optimizer.
                unoptimized
                className="size-10 shrink-0 rounded-full border border-white/30 object-cover"
              />
            ) : (
              <div className="size-10 shrink-0 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm" />
            )}
            <div className="flex flex-col justify-center gap-0.5 min-w-0">
              <div className="text-white text-xs font-semibold leading-4 truncate">
                {game.opponent ? `vs. ${game.opponent}` : game.title}
              </div>
              {game.title && game.opponent && (
                <div className="text-white/40 text-xs font-normal leading-5 truncate">{game.title}</div>
              )}
            </div>
          </div>
        </div>
        {/* TEAM */}
        <div className="flex-1 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
          <div className="text-white text-xs font-medium uppercase leading-4 truncate">
            {game.homeAway ?? "—"}
          </div>
        </div>
        {/* LOCATION */}
        <div className="w-36 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
          <div className="flex flex-col gap-1 min-w-0 w-full">
            <div className="flex items-center gap-1">
              <div className={cn("size-3 rounded-full shrink-0", game.homeAway === "home" ? "bg-green-400" : game.homeAway === "away" ? "bg-violet-500" : "bg-white/40")} />
              <div className="text-white text-xs font-medium uppercase leading-4">{game.homeAway ?? "neutral"}</div>
            </div>
            <div className="text-white/40 text-xs font-normal leading-5 truncate">{game.location ?? "—"}</div>
          </div>
        </div>
        {/* TIME */}
        <div className="w-20 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
          <div className="flex flex-col gap-1">
            <div className="text-white text-xs font-medium uppercase leading-4 whitespace-nowrap">{time}</div>
            {tz && <div className="text-white/40 text-xs font-normal leading-5">{tz}</div>}
          </div>
        </div>
        {/* STATUS */}
        <div className="flex-1 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
          <div className={cn("h-6 px-3 rounded-full flex items-center", statusColor)}>
            <span className="text-slate-900 text-xs font-medium whitespace-nowrap">{statusText}</span>
          </div>
        </div>
        {/* ACTIONS */}
        <div className="w-20 px-2 py-4 bg-white/5 flex justify-center items-center">
          <RowActionsMenu
            ariaLabel="Game actions"
            items={[
              { label: "Edit", onSelect: () => onEdit(game) },
              { label: "Delete", onSelect: () => onDelete(game), variant: "destructive" },
            ]}
          />
        </div>
      </div>
      {expanded && <GameDetailsPanel gameId={game.id} />}
    </div>
  );
}

// Formats an event's date range, e.g. "Jul 10–12, 2026" / "Jul 30 – Aug 2, 2026".
// Dates arrive as UTC midnight, so format in UTC to avoid an off-by-one day.
function formatEventDates(start: string, end: string | null): string {
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "—";
  const full: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };
  const e = end ? new Date(end) : null;
  if (!e || Number.isNaN(e.getTime()) || e.getTime() === s.getTime()) {
    return s.toLocaleDateString("en-US", full);
  }
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  if (sameYear && s.getUTCMonth() === e.getUTCMonth()) {
    const month = s.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    return `${month} ${s.getUTCDate()}–${e.getUTCDate()}, ${s.getUTCFullYear()}`;
  }
  if (sameYear) {
    const md: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
    return `${s.toLocaleDateString("en-US", md)} – ${e.toLocaleDateString("en-US", md)}, ${s.getUTCFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", full)} – ${e.toLocaleDateString("en-US", full)}`;
}

const EVENT_MENU: { label: string; view: ExposureEventView }[] = [
  { label: "Brackets", view: "brackets" },
  { label: "Game Schedule", view: "games" },
  { label: "Teams", view: "teams" },
  { label: "Standings", view: "standings" },
  { label: "Venues", view: "venues" },
];

function ExposureEventRow({
  event,
  onOpenView,
}: {
  event: ExposureEvent;
  onOpenView: (event: ExposureEvent, view: ExposureEventView) => void;
}) {
  const location = [event.city, event.state].filter(Boolean).join(", ") || "—";

  return (
    <div className="flex justify-start items-stretch border-b border-white/20">
      {/* EVENT */}
      <div className="flex-1 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
        <div className="text-white text-xs font-semibold leading-4 truncate">{event.name}</div>
      </div>
      {/* DATES */}
      <div className="w-40 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
        <div className="text-white/80 text-xs font-medium leading-4 truncate">
          {formatEventDates(event.startDate, event.endDate)}
        </div>
      </div>
      {/* LOCATION */}
      <div className="w-36 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
        <div className="text-white/80 text-xs font-medium leading-4 truncate">{location}</div>
      </div>
      {/* SPORT */}
      <div className="w-24 px-2 py-4 bg-white/5 flex items-center overflow-hidden">
        <div className="text-white/80 text-xs font-medium uppercase leading-4 truncate">{event.sport ?? "—"}</div>
      </div>
      {/* GAMES */}
      <div className="w-16 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
        <div className="text-white text-xs font-medium leading-4">{event.gameCount}</div>
      </div>
      {/* TEAMS */}
      <div className="w-16 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
        <div className="text-white text-xs font-medium leading-4">{event.teamCount}</div>
      </div>
      {/* DIVISIONS */}
      <div className="w-16 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
        <div className="text-white text-xs font-medium leading-4">{event.divisionCount}</div>
      </div>
      {/* ACTIONS */}
      <div className="w-20 px-2 py-4 bg-white/5 flex justify-center items-center">
        <RowActionsMenu
          ariaLabel="Event actions"
          items={EVENT_MENU.map((m) => ({
            label: m.label,
            onSelect: () => onOpenView(event, m.view),
          }))}
        />
      </div>
    </div>
  );
}

function MiniCalendar({ games }: { games: ScheduleItem[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const grid = buildMonthGrid(year, month);
  const dots = buildCalendarDots(games.filter((g) => {
    const d = new Date(g.start);
    return d.getFullYear() === year && d.getMonth() === month;
  }));

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  return (
    <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-white text-base font-bold uppercase font-display tracking-wide">Calendar</div>
        <button type="button" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="text-white/60 text-xs hover:text-white transition-colors">Today</button>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={prev} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <span className="text-white text-sm font-semibold">{monthLabel}</span>
        <button type="button" onClick={next} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Next month">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-0">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className="text-center text-white/50 text-[10px] font-semibold pb-1">{d}</div>
          ))}
          {grid.map((cell, i) => {
            const dayDots = cell ? dots[cell] : undefined;
            const isToday = isCurrentMonth && cell === today;
            return (
              <div key={i} className="flex flex-col items-center py-0.5 gap-0.5">
                {cell ? (
                  <>
                    <div
                      className={cn("w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium text-white hover:bg-white/10 transition-colors", isToday && "font-bold")}
                      style={isToday ? { background: "var(--gradient-cta)" } : undefined}
                    >
                      {cell}
                    </div>
                    <div className="flex gap-0.5 h-2 items-center">
                      {dayDots?.slice(0, 2).map((type, di) => (
                        <div key={di} className={cn("w-1 h-1 rounded-full", DOT_COLORS[type] ?? "bg-white/30")} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-7 h-7" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-white/10">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
            <span className="text-white/60 text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextGameCard({ game }: { game: ScheduleItem | null }) {
  const { savedSchool } = useSetup();
  if (!game) return null;
  const dateLabel = formatNextGameDate(game.start);
  const { time } = formatTime(game.start, game.isAllDay);

  return (
    <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
      <div className="text-white text-base font-bold uppercase font-display tracking-wide">Next Game</div>
      <div className="flex items-center justify-between gap-2 p-4 bg-white/5 rounded-lg outline outline-1 outline-white/10">
        <TeamSide name={savedSchool?.name || "My Team"} logoUrl={savedSchool?.logoUrl} />
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 text-center">
          <div className="text-white/60 text-xs font-medium uppercase whitespace-nowrap">{dateLabel}</div>
          <div className="text-white text-2xl font-extrabold font-display whitespace-nowrap">{time}</div>
        </div>
        <TeamSide name={game.opponent ?? "TBD"} logoUrl={game.opponentLogoUrl} />
      </div>
    </div>
  );
}

function ScheduleTools({ onAddGame }: { onAddGame: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full" aria-expanded={open}>
        <div className="text-white text-base font-bold uppercase font-display tracking-wide">Schedule Tools</div>
        <ChevronDown className={cn("w-5 h-5 text-white transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col gap-1">
          {SCHEDULE_TOOLS.map(({ icon: Icon, label, description }) => (
            <button
              key={label}
              type="button"
              onClick={label === "Add Game" ? onAddGame : undefined}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-white shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex flex-col gap-0.5">
                <span className="text-white text-sm font-medium">{label}</span>
                <span className="text-white/50 text-xs">{description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_FILTERS = { view: "upcoming", season: "", level: "", gender: "", venue: "", division: "" };
type ScheduleFilters = typeof DEFAULT_FILTERS;

export default function SchedulePage() {
  const router = useRouter();
  const [games, setGames] = useState<ScheduleItem[]>([]);
  const [pagination, setPagination] = useState<SchedulePagination | null>(null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  // By the org's type (/me organizationType): a school gets the Games tab, Add Game and Schedule
  // Tools; a tournament gets the Events tab only.
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  const tabs = isTournament ? TOURNAMENT_TABS : SCHOOL_TABS;
  const activeTab = tabs[0];
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGame, setEditGame] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);

  // Synced Exposure events (loaded while the Events tab is open), paged and filtered by the API.
  const [events, setEvents] = useState<ExposureEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  // The event picked at the top (tournament): its games replace the events list.
  // Shared with every page's event picker.
  const { event: pickedEvent, setEvent: setPickedEvent, noEvents } = useSelectedEvent();
  const [eventPage, setEventPage] = useState(1);
  const [eventFilters, setEventFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const setEventFilter = (key: keyof EventFilters) => (value: string) => {
    setEventFilters((f) => ({ ...f, [key]: value }));
    setEventPage(1);
  };
  const eventFilterCount = [eventFilters.sport, eventFilters.state, eventFilters.from, eventFilters.to].filter(Boolean).length;
  const [eventsPaging, setEventsPaging] = useState<{ total: number; totalPages: number } | null>(null);
  // Counts per status (for the filter options and the Events stat card), after the search.
  // Every synced event, kept from an unfiltered answer, for the Events stat card.
  const [eventsOrgTotal, setEventsOrgTotal] = useState<number | null>(null);
  // Which event + view the details modal is showing (null = closed).
  const [eventView, setEventView] = useState<{ event: ExposureEvent; view: ExposureEventView } | null>(null);

  const [filters, setFilters] = useState<ScheduleFilters>(DEFAULT_FILTERS);
  const activeFilterCount = [filters.season, filters.level, filters.gender, filters.venue, filters.division].filter(Boolean).length;
  const setFilter = (key: keyof ScheduleFilters) => (value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const viewLabel = SCHEDULE_VIEW_FILTERS.find((o) => o.value === filters.view)?.label ?? "Upcoming";

  // Debounce search — also reset to page 1 so results reflect the new query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
       
      setPage(1);
      setEventPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const [refreshKey, setRefreshKey] = useState(0);
  const fetchGames = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    // Past games read newest-first; everything else runs in date order.
    const params: Record<string, unknown> = { page, limit: 20, sortOrder: filters.view === "past" ? "desc" : "asc" };
    if (debouncedSearch) params.search = debouncedSearch;
    const today = new Date().toISOString().slice(0, 10);
    if (filters.view === "past") params.to = today;
    if (filters.view === "upcoming") params.from = today;
    if (filters.view === "home" || filters.view === "away") params.homeAway = filters.view;
    if (filters.season) params.season = filters.season;
    if (filters.level)  params.level  = filters.level;
    if (filters.gender) params.gender = filters.gender;
    if (filters.venue)  params.venue  = filters.venue;
    if (filters.division) params.division = filters.division;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.listSchedules,
      method: "GET",
      data: params,
    }).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const payload = (result.data as unknown as ScheduleListResponse).data?.[0];
        setGames((prev) => page === 1 ? (payload?.items ?? []) : [...prev, ...(payload?.items ?? [])]);
        setPagination(payload?.pagination ?? null);
        if (payload?.summary) setSummary(payload.summary);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, debouncedSearch, refreshKey, filters]);

  // Lazy-load synced Exposure events the first time the Events tab is opened (and on re-open).
  useEffect(() => {
    if (activeTab !== "Events") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEventsLoading(true);
    apiCall<ExposureEventsResponse>({
      endpoint: routes.api.listExposureEvents,
      method: "GET",
      data: {
        page: eventPage,
        limit: EVENTS_PAGE_SIZE,
        sort: eventFilters.sort,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(eventFilters.sport && { sport: eventFilters.sport }),
        ...(eventFilters.state && { state: eventFilters.state }),
        ...(eventFilters.from && { from: eventFilters.from }),
        ...(eventFilters.to && { to: eventFilters.to }),
      },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      setEvents(body?.items ?? []);
      setEventsPaging(body ? { total: body.pagination.total, totalPages: body.pagination.totalPages } : null);
      const unfiltered = !debouncedSearch && !eventFilters.sport && !eventFilters.state && !eventFilters.from && !eventFilters.to;
      if (body && unfiltered) setEventsOrgTotal(body.summary.all);
      setEventsLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, eventPage, debouncedSearch, eventFilters]);

  const nextGame = games.find((g) => new Date(g.start) > new Date()) ?? null;
  const gameStats = summary ? buildStatsFromSummary(summary) : buildStatsFromGames(games);
  // A tournament's Events card counts its synced events (the games summary's "events" isn't that).
  const stats = isTournament
    ? gameStats.map((st) => (st.label === "Events" ? { ...st, subtitle: "Synced events", value: eventsOrgTotal ?? 0 } : st))
    : gameStats;
  // A tournament's Events tab always shows one event (the newest until another is picked).
  const showEventGames = activeTab === "Events" && (isTournament || !!pickedEvent);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
      {/* Add/Edit modal */}
      <AddGameModal
        isOpen={showAddModal || !!editGame}
        onClose={() => { setShowAddModal(false); setEditGame(null); }}
        onSaved={fetchGames}
        editGame={editGame}
      />
      {/* Delete modal */}
      <DeleteGameModal
        game={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={fetchGames}
      />
      {/* Exposure event details modal (Brackets / Games / Teams / Standings / Venues).
          Keyed so it remounts (and resets to the clicked view) each time a row opens it;
          in-modal tab switches don't change eventView, so they don't remount. */}
      <ExposureEventModal
        key={eventView ? `${eventView.event.id}-${eventView.view}` : "closed"}
        event={eventView?.event ?? null}
        initialView={eventView?.view ?? "brackets"}
        onClose={() => setEventView(null)}
      />

      {/* Left — main content */}
      <div className="flex-1 flex flex-col gap-6 lg:gap-10 min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-white text-3xl sm:text-4xl lg:text-6xl font-extrabold font-display uppercase leading-none">Schedule</h2>
            <p className="text-white text-base font-normal mt-1">Manage your games, events, and schedule information.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4">
            {/* Tournament: one event at a time (the newest at first), to drill into its divisions and teams. */}
            {isTournament && (
              <EventSelect
                value={pickedEvent?.id ?? ""}
                allowAll={false}
                selectedName={pickedEvent?.name}
                onChange={(id, name) => setPickedEvent(id ? { id, name } : null)}
              />
            )}
            <Button
              className="cursor-pointer"
              variant="ghost"
              label="Import Schedule"
              icon={<CloudUpload className="w-5 h-5" strokeWidth={2} />}
              onClick={() => router.push(routes.ui.importSchedule)}
            />
            {!isTournament && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-12 px-6 rounded-lg flex items-center gap-2 text-white text-base font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add Game
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 lg:gap-10">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>

        {/* Games panel */}
        <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-6">
          {/* Tabs */}
          <div className="relative h-11 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
            <div className="flex items-start h-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button key={tab} type="button" className="w-28 flex flex-col items-center gap-3 relative h-full justify-end">
                    <span className={cn("text-base font-medium pb-3", isActive ? "text-white" : "text-white/60 hover:text-white transition-colors")}>
                      {isTournament && tab === "Events" ? "Schedule" : tab}
                    </span>
                    <div className={cn("absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-opacity", isActive ? "opacity-100" : "opacity-0")} style={{ background: "var(--gradient-cta)" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + Filters (not while one event's games are shown) */}
          {!showEventGames && (
          <div className="flex items-center gap-6">
            <div className="flex-1 h-12 px-4 py-3 bg-white rounded-lg shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.16)] outline outline-2 outline-offset-[-2px] outline-slate-900/10 backdrop-blur-[32px] flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-900 shrink-0" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 text-base font-medium placeholder:text-slate-900/60 outline-none"
              />
            </div>
          </div>
          )}

          {/* Filters: the Events tab filters by status; the game filters belong to the Games tab. */}
          {showEventGames ? null : activeTab === "Events" ? (
          // Bottom-aligned: the date fields carry a label above their box.
          <div className="flex flex-wrap items-end gap-3">
            <FilterDropdown label="Sport" icon={<Trophy className="w-5 h-5" strokeWidth={1.5} />} options={SPORTS_OPTIONS} value={eventFilters.sport} onChange={setEventFilter("sport")} />
            <FilterDropdown label="State" icon={<MapPin className="w-5 h-5" strokeWidth={1.5} />} options={US_STATE_OPTIONS} value={eventFilters.state} onChange={setEventFilter("state")} />
            <FilterDropdown label="Newest first" clearable={false} options={EVENT_SORTS} value={eventFilters.sort} onChange={setEventFilter("sort")} />
            <DateField label="From" name="eventsFrom" value={eventFilters.from} onChange={setEventFilter("from")} placeholder="Start date" className="w-44" labelClassName="text-sm" />
            <DateField label="To" name="eventsTo" value={eventFilters.to} min={eventFilters.from || undefined} onChange={setEventFilter("to")} placeholder="End date" className="w-44" labelClassName="text-sm" />
            {eventFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEventFilters((f) => ({ ...DEFAULT_EVENT_FILTERS, sort: f.sort }));
                  setEventPage(1);
                }}
                className="cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          ) : (
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              label="Upcoming"
              variant="accent"
              clearable={false}
              options={SCHEDULE_VIEW_FILTERS}
              value={filters.view}
              onChange={setFilter("view")}
            />
            <FilterDropdown label="Season" icon={<Play className="w-5 h-5" strokeWidth={1.5} />} options={SCHEDULE_SEASON_FILTERS} value={filters.season} onChange={setFilter("season")} />
            <FilterDropdown label="Level" icon={<ChartNoAxesColumn className="w-5 h-5" strokeWidth={1.5} />} options={SCHEDULE_LEVEL_FILTERS} value={filters.level} onChange={setFilter("level")} />
            <FilterDropdown label="Gender" icon={<Users className="w-5 h-5" strokeWidth={1.5} />} options={SCHEDULE_GENDER_FILTERS} value={filters.gender} onChange={setFilter("gender")} />
            <FilterDropdown label="All Venues" icon={<MapPin className="w-5 h-5" strokeWidth={1.5} />} options={SCHEDULE_VENUE_FILTERS} value={filters.venue} onChange={setFilter("venue")} />
            <FilterDropdown label="All Divisions" icon={<Trophy className="w-5 h-5" strokeWidth={1.5} />} options={SCHEDULE_DIVISION_FILTERS} value={filters.division} onChange={setFilter("division")} />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilters((f) => ({ ...DEFAULT_FILTERS, view: f.view }));
                  setPage(1);
                }}
                className="cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          )}

          {activeTab === "Games" && (
            <div className="flex flex-col">
              <button type="button" onClick={() => setUpcomingOpen((v) => !v)} className="flex items-center gap-2 mb-4">
                <span className="text-white text-3xl font-extrabold font-display uppercase">
                  {viewLabel} ({pagination?.total ?? games.length})
                </span>
                <ChevronDown className={cn("w-5 h-5 text-white transition-transform", upcomingOpen && "rotate-180")} />
              </button>

              {upcomingOpen && (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                  {/* Table header */}
                  <div className="flex items-center border-b border-white/20">
                    {[
                      { label: "", cls: "w-14" },
                      { label: "DATE", cls: "flex-1 justify-center" },
                      { label: "OPPONENT", cls: "w-52" },
                      { label: "HOME/AWAY", cls: "flex-1" },
                      { label: "LOCATION", cls: "w-36" },
                      { label: "TIME", cls: "w-20" },
                      { label: "STATUS", cls: "flex-1 justify-center" },
                      { label: "ACTIONS", cls: "w-20" },
                    ].map(({ label, cls }) => (
                      <div key={label} className={cn("h-10 px-2 bg-white/10 flex items-center gap-1", cls)}>
                        <span className="text-white text-xs font-semibold uppercase leading-4">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Loading */}
                  {loading && (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                    </div>
                  )}

                  {/* Empty */}
                  {!loading && games.length === 0 && (
                    <div className="flex justify-center items-center py-12 text-white/40 text-sm">
                      {debouncedSearch || activeFilterCount > 0 ? "No games match your search or filters." : "No games scheduled yet."}
                    </div>
                  )}

                  {/* Rows */}
                  {!loading && games.map((game) => (
                    <GameRow
                      key={game.id}
                      game={game}
                      onEdit={(g) => setEditGame(g)}
                      onDelete={(g) => setDeleteTarget(g)}
                    />
                  ))}
                  </div>

                  {/* Load more */}
                  {!loading && pagination && !pagination.isLast && (
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      className="mt-4 mx-auto h-10 px-6 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {showEventGames &&
            (pickedEvent ? (
              <EventGames key={pickedEvent.id} eventId={pickedEvent.id} eventName={pickedEvent.name} />
            ) : noEvents ? (
              <p className="py-12 text-center text-sm text-white/60">Pick an event to see its schedule.</p>
            ) : (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              </div>
            ))}

          {activeTab === "Events" && !showEventGames && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white text-3xl font-extrabold font-display uppercase">
                  All Events ({eventsPaging?.total ?? events.length})
                </span>
              </div>

              <div className="overflow-x-auto">
                {/* Table header */}
                <div className="flex items-center border-b border-white/20">
                  {[
                    { label: "EVENT", cls: "flex-1" },
                    { label: "DATES", cls: "w-40" },
                    { label: "LOCATION", cls: "w-36" },
                    { label: "SPORT", cls: "w-24" },
                    { label: "GAMES", cls: "w-16 justify-center" },
                    { label: "TEAMS", cls: "w-16 justify-center" },
                    { label: "DIV", cls: "w-16 justify-center" },
                    { label: "ACTIONS", cls: "w-20 justify-center" },
                  ].map(({ label, cls }) => (
                    <div key={label} className={cn("h-10 px-2 bg-white/10 flex items-center gap-1", cls)}>
                      <span className="text-white text-xs font-semibold uppercase leading-4">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Loading */}
                {eventsLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                  </div>
                )}

                {/* Empty */}
                {!eventsLoading && events.length === 0 && (
                  <div className="flex justify-center items-center py-12 text-white/40 text-sm">
                    No synced events yet.
                  </div>
                )}

                {/* Rows */}
                {!eventsLoading && events.map((event) => (
                  <ExposureEventRow
                    key={event.id}
                    event={event}
                    onOpenView={(ev, view) => setEventView({ event: ev, view })}
                  />
                ))}
              </div>

              {!eventsLoading && eventsPaging && eventsPaging.total > EVENTS_PAGE_SIZE && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm text-white/60">
                    {`Showing ${(eventPage - 1) * EVENTS_PAGE_SIZE + 1} to ${Math.min(eventPage * EVENTS_PAGE_SIZE, eventsPaging.total)} of ${eventsPaging.total} events`}
                  </span>
                  <Pagination page={eventPage} pageCount={Math.max(1, eventsPaging.totalPages)} onChange={setEventPage} />
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-full lg:w-[320px] lg:shrink-0 flex flex-col gap-6">
        <NextGameCard game={nextGame} />
        <MiniCalendar games={games} />
        {!isTournament && <ScheduleTools onAddGame={() => setShowAddModal(true)} />}
      </div>
    </div>
  );
}
