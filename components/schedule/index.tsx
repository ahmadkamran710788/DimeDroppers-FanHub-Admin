"use client";

import AddGameModal from "@/components/schedule/AddGameModal";
import DeleteGameModal from "@/components/schedule/DeleteGameModal";
import { cn } from "@/utils/cn";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ScheduleItem, ScheduleListResponse, SchedulePagination } from "@/utils/types/schedule";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  CalendarPlus,
  CalendarDays,
  Copy,
  Download,
  Printer,
  Layers,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ["Games", "Calendar", "Locations", "Opponents"];

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

function parseGameDate(iso: string): { day: number; month: string; weekday: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: 0, month: "---", weekday: "---" };
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

function formatTime(iso: string, isAllDay: boolean): { time: string; tz: string } {
  if (isAllDay) return { time: "All Day", tz: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { time: "---", tz: "" };
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop() ?? "";
  return { time, tz };
}

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

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats(games: ScheduleItem[]) {
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { day, month, weekday } = parseGameDate(game.start);
  const { time, tz } = formatTime(game.start, game.isAllDay);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const statusColor = game.status === "cancelled" ? "bg-red-400" : game.status === "tentative" ? "bg-yellow-400" : "bg-green-400";
  const statusText = game.status === "cancelled" ? "Cancelled" : game.status === "tentative" ? "Tentative" : "Scheduled";

  return (
    <div className="flex justify-start items-stretch border-b border-white/20">
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.opponentLogoUrl}
              alt=""
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
      <div className="w-16 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
        <div className="flex flex-col gap-1">
          <div className="text-white text-xs font-medium uppercase leading-4">{time}</div>
          {tz && <div className="text-white/40 text-xs font-normal leading-5">{tz}</div>}
        </div>
      </div>
      {/* STATUS */}
      <div className="flex-1 px-2 py-4 bg-white/5 flex justify-center items-center overflow-hidden">
        <div className={cn("h-6 px-3 rounded-full flex items-center", statusColor)}>
          <span className="text-slate-900 text-xs font-medium">{statusText}</span>
        </div>
      </div>
      {/* ACTIONS */}
      <div className="w-20 px-2 py-4 bg-white/5 flex justify-center items-center relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="size-10 px-2 bg-white/10 rounded-lg outline outline-1 outline-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Game actions"
        >
          <MoreVertical className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
        {menuOpen && (
          <div className="absolute right-2 top-full mt-1 z-20 bg-[#0B1C2D] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit(game); }}
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(game); }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        )}
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
  if (!game) return null;
  const dateLabel = formatNextGameDate(game.start);
  const { time } = formatTime(game.start, game.isAllDay);

  return (
    <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-4">
      <div className="text-white text-base font-bold uppercase font-display tracking-wide">Next Game</div>
      <div className="flex items-center justify-between gap-3 p-4 bg-white/5 rounded-lg outline outline-1 outline-white/10">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="size-12 bg-white/20 rounded-full border border-white/30 flex items-center justify-center overflow-hidden">
            <CalendarDays className="w-6 h-6 text-white/60" strokeWidth={1.5} />
          </div>
          <span className="text-white text-xs font-semibold text-center">My Team</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="text-white/60 text-xs font-medium uppercase">{dateLabel}</div>
          <div className="text-white text-2xl font-extrabold font-display">{time}</div>
          <div className="text-white/60 text-xs font-medium text-center truncate max-w-full">{game.location ?? "TBD"}</div>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          {game.opponentLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.opponentLogoUrl} alt="" className="size-12 rounded-full border border-white/30 object-cover" />
          ) : (
            <div className="size-12 bg-white/20 rounded-full border border-white/30 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-white/60" strokeWidth={1.5} />
            </div>
          )}
          <span className="text-white text-xs font-semibold text-center truncate max-w-[80px]">{game.opponent ?? "TBD"}</span>
        </div>
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

export default function SchedulePage() {
  const [games, setGames] = useState<ScheduleItem[]>([]);
  const [pagination, setPagination] = useState<SchedulePagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Games");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGame, setEditGame] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);

  // Debounce search — also reset to page 1 so results reflect the new query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
       
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const [refreshKey, setRefreshKey] = useState(0);
  const fetchGames = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const params: Record<string, unknown> = { page, limit: 20, sortOrder: "asc" };
    if (debouncedSearch) params.search = debouncedSearch;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.proxyListSchedules,
      method: "GET",
      data: params,
    }).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const payload = (result.data as unknown as ScheduleListResponse).data?.[0];
        setGames(payload?.items ?? []);
        setPagination(payload?.pagination ?? null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, debouncedSearch, refreshKey]);

  const nextGame = games.find((g) => new Date(g.start) > new Date()) ?? null;
  const stats = computeStats(games);

  return (
    <div className="flex gap-10 items-start">
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

      {/* Left — main content */}
      <div className="flex-1 flex flex-col gap-10 min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-white text-6xl font-extrabold font-display uppercase leading-none">Schedule</h2>
            <p className="text-white text-base font-normal mt-1">Manage your games, events, and schedule information.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-12 px-6 rounded-lg flex items-center gap-2 text-white text-base font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Game
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-10">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>

        {/* Games panel */}
        <div className="p-6 bg-white/5 rounded-lg outline outline-2 outline-offset-[-2px] outline-white/10 backdrop-blur-xl flex flex-col gap-6 overflow-hidden">
          {/* Tabs */}
          <div className="relative h-11 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
            <div className="flex items-start h-full">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="w-28 px-2 flex flex-col items-start gap-3 relative h-full justify-end">
                    <span className={cn("text-base font-medium pb-3", isActive ? "text-white" : "text-white/60 hover:text-white transition-colors")}>{tab}</span>
                    <div className={cn("absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-opacity", isActive ? "opacity-100" : "opacity-0")} style={{ background: "var(--gradient-cta)" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + Filters */}
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
            <button type="button" className="w-28 h-12 px-3 bg-white/10 rounded-lg outline outline-1 outline-white/20 backdrop-blur-xl flex items-center gap-2 text-white text-base font-medium hover:bg-white/20 transition-colors">
              <SlidersHorizontal className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              Filters
            </button>
          </div>

          {activeTab === "Games" && (
            <div className="flex flex-col">
              <button type="button" onClick={() => setUpcomingOpen((v) => !v)} className="flex items-center gap-2 mb-4">
                <span className="text-white text-3xl font-extrabold font-display uppercase">
                  Upcoming ({pagination?.total ?? games.length})
                </span>
                <ChevronDown className={cn("w-5 h-5 text-white transition-transform", upcomingOpen && "rotate-180")} />
              </button>

              {upcomingOpen && (
                <div className="flex flex-col">
                  {/* Table header */}
                  <div className="flex items-center border-b border-white/20">
                    {[
                      { label: "DATE", cls: "flex-1 justify-center" },
                      { label: "OPPONENT", cls: "w-52" },
                      { label: "HOME/AWAY", cls: "flex-1" },
                      { label: "LOCATION", cls: "w-36" },
                      { label: "TIME", cls: "w-16" },
                      { label: "STATUS", cls: "flex-1" },
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
                      {debouncedSearch ? "No games match your search." : "No games scheduled yet."}
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

          {activeTab !== "Games" && (
            <div className="flex items-center justify-center py-20 text-white/30 text-sm font-medium">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-[320px] shrink-0 flex flex-col gap-6">
        <NextGameCard game={nextGame} />
        <MiniCalendar games={games} />
        <ScheduleTools onAddGame={() => setShowAddModal(true)} />
      </div>
    </div>
  );
}
