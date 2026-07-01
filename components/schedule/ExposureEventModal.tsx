"use client";

import { cn } from "@/utils/cn";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ExposureEvent,
  ExposureEventView,
  ExposureListResponse,
  ExposureBracket,
  ExposureDivision,
  ExposureGame,
  ExposureTeam,
  ExposureStanding,
  ExposureVenue,
  ExposurePlayer,
} from "@/utils/types/exposure-event";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

interface ExposureEventModalProps {
  event: ExposureEvent | null; // non-null = open
  initialView: ExposureEventView;
  onClose: () => void;
}

const VIEW_TABS: { view: ExposureEventView; label: string }[] = [
  { view: "brackets", label: "Brackets" },
  { view: "games", label: "Game Schedule" },
  { view: "teams", label: "Teams" },
  { view: "standings", label: "Standings" },
  { view: "venues", label: "Venues" },
];

// ─── Generic dark table ─────────────────────────────────────────────────────────

interface Column<T> {
  header: string;
  cls?: string; // width / alignment utilities, applied to header AND cells for alignment
  cell: (row: T) => ReactNode;
}

function ModalTable<T>({
  columns,
  rows,
  getKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T, index: number) => string;
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="flex items-center border-b border-white/20">
        {columns.map((col) => (
          <div key={col.header} className={cn("h-10 px-2 bg-white/10 flex items-center gap-1", col.cls)}>
            <span className="text-white text-xs font-semibold uppercase leading-4">{col.header}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="flex justify-center items-center py-12 text-white/40 text-sm">{empty}</div>
      ) : (
        rows.map((row, index) => (
          <div key={getKey(row, index)} className="flex items-stretch border-b border-white/20">
            {columns.map((col) => {
              const content = col.cell(row);
              return (
                <div
                  key={col.header}
                  className={cn(
                    "px-2 py-3 bg-white/5 flex items-center overflow-hidden text-white text-xs font-medium leading-4",
                    col.cls
                  )}
                >
                  {typeof content === "string" || typeof content === "number" ? (
                    <span className="truncate">{content}</span>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Small presentational helpers ───────────────────────────────────────────────

function ExternalAnchor({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
    >
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === "cancelled" ? "bg-red-400" : s === "tentative" ? "bg-yellow-400" : "bg-green-400";
  return (
    <span className={cn("inline-flex h-5 px-2 rounded-full items-center", color)}>
      <span className="text-slate-900 text-[11px] font-medium capitalize">{status}</span>
    </span>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : v);

// ─── Per-view tables ────────────────────────────────────────────────────────────

function BracketsTable({ divisions }: { divisions: ExposureDivision[] }) {
  // Flatten to one row per bracket; divisions with no brackets still get a row.
  const rows = (divisions ?? []).flatMap((division) =>
    division.brackets?.length
      ? division.brackets.map((bracket) => ({ division, bracket }))
      : [{ division, bracket: null as ExposureBracket | null }]
  );
  const columns: Column<{ division: ExposureDivision; bracket: ExposureBracket | null }>[] = [
    { header: "Division", cls: "w-44", cell: (r) => dash(r.division.name) },
    { header: "Bracket", cls: "flex-1", cell: (r) => dash(r.bracket?.name) },
    { header: "Rounds", cls: "flex-1", cell: (r) => dash(r.bracket?.results?.map((x) => x.Name).join(", ")) },
    {
      header: "Link",
      cls: "w-20 justify-center",
      cell: (r) => (r.bracket?.url ? <ExternalAnchor href={r.bracket.url} label="Open" /> : "—"),
    },
  ];
  return (
    <ModalTable
      columns={columns}
      rows={rows}
      getKey={(r, i) => r.bracket?.id ?? `${r.division.id}-${i}`}
      empty="No brackets found for this event."
    />
  );
}

function GamesTable({ games }: { games: ExposureGame[] }) {
  const columns: Column<ExposureGame>[] = [
    { header: "Date", cls: "w-32", cell: (g) => formatDateTime(g.start) },
    { header: "Matchup", cls: "flex-1", cell: (g) => dash(g.title ?? g.opponent) },
    { header: "Division", cls: "w-28", cell: (g) => dash(g.sports) },
    { header: "Location", cls: "flex-1", cell: (g) => dash(g.location) },
    { header: "Result", cls: "w-20 justify-center", cell: (g) => dash(g.result) },
    { header: "Status", cls: "w-24 justify-center", cell: (g) => (g.status ? <StatusBadge status={g.status} /> : "—") },
  ];
  return <ModalTable columns={columns} rows={games} getKey={(g) => g.id} empty="No games found for this event." />;
}

function TeamsTable({
  teams,
  onViewPlayers,
}: {
  teams: ExposureTeam[];
  onViewPlayers: (team: ExposureTeam) => void;
}) {
  const columns: Column<ExposureTeam>[] = [
    { header: "Team", cls: "flex-1", cell: (t) => dash(t.name) },
    { header: "Division", cls: "w-32", cell: (t) => dash(t.divisionName) },
    { header: "Pool", cls: "w-24", cell: (t) => dash(t.pool) },
    { header: "Age", cls: "w-16", cell: (t) => dash(t.age) },
    { header: "Grade", cls: "w-16", cell: (t) => dash(t.grade) },
    {
      header: "Players",
      cls: "w-24 justify-center",
      cell: (t) => (
        <button
          type="button"
          onClick={() => onViewPlayers(t)}
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
          aria-label={`View players for ${t.name}`}
        >
          <span>{t._count?.players ?? 0}</span>
          <ChevronRight className="w-3 h-3 shrink-0" />
        </button>
      ),
    },
  ];
  return <ModalTable columns={columns} rows={teams} getKey={(t) => t.id} empty="No teams found for this event." />;
}

function PlayersTable({ players }: { players: ExposurePlayer[] }) {
  const columns: Column<ExposurePlayer>[] = [
    { header: "Name", cls: "flex-1", cell: (p) => dash([p.firstName, p.lastName].filter(Boolean).join(" ")) },
    { header: "Pos", cls: "w-16", cell: (p) => dash(p.position) },
    { header: "Grade", cls: "w-16", cell: (p) => dash(p.grade) },
    { header: "Grad Yr", cls: "w-20", cell: (p) => dash(p.graduationYear) },
    { header: "Ht", cls: "w-16", cell: (p) => dash(p.height) },
    { header: "Wt", cls: "w-16", cell: (p) => dash(p.weight) },
    { header: "School", cls: "flex-1", cell: (p) => dash(p.playerSchool) },
  ];
  return <ModalTable columns={columns} rows={players} getKey={(p) => p.id} empty="No players found for this team." />;
}

function StandingsTable({ standings }: { standings: ExposureStanding[] }) {
  // Stat columns are dynamic — collect the union of `columns` keys in first-seen order.
  const statKeys: string[] = [];
  for (const s of standings) {
    if (s.columns) for (const k of Object.keys(s.columns)) if (!statKeys.includes(k)) statKeys.push(k);
  }
  const columns: Column<ExposureStanding>[] = [
    { header: "Place", cls: "w-16 justify-center", cell: (s) => dash(s.place) },
    { header: "Team", cls: "flex-1", cell: (s) => dash(s.teamName) },
    { header: "Group", cls: "w-32", cell: (s) => dash(s.groupName) },
    { header: "Pool", cls: "w-28", cell: (s) => dash(s.poolName) },
    ...statKeys.map(
      (key): Column<ExposureStanding> => ({
        header: key,
        cls: "w-14 justify-center",
        cell: (s) => dash(s.columns?.[key]),
      })
    ),
  ];
  return <ModalTable columns={columns} rows={standings} getKey={(s) => s.id} empty="No standings found for this event." />;
}

function VenuesTable({ venues }: { venues: ExposureVenue[] }) {
  const columns: Column<ExposureVenue>[] = [
    { header: "Venue", cls: "flex-1", cell: (v) => dash(v.name) },
    { header: "Abbr", cls: "w-20", cell: (v) => dash(v.abbr) },
    {
      header: "Address",
      cls: "flex-1",
      cell: (v) => dash([v.streetAddress, v.city, v.state, v.postalCode].filter(Boolean).join(", ")),
    },
    {
      header: "Courts",
      cls: "w-44",
      cell: (v) => (v.courts?.length ? `${v.courts.length} (${v.courts.map((c) => c.Name).join(", ")})` : "—"),
    },
    {
      header: "Map",
      cls: "w-16 justify-center",
      cell: (v) =>
        v.latitude != null && v.longitude != null ? (
          <ExternalAnchor href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`} label="Map" />
        ) : (
          "—"
        ),
    },
  ];
  return <ModalTable columns={columns} rows={venues} getKey={(v) => v.id} empty="No venues found for this event." />;
}

function renderView(
  view: ExposureEventView,
  rows: unknown[],
  onViewPlayers: (team: ExposureTeam) => void
): ReactNode {
  switch (view) {
    case "brackets":
      return <BracketsTable divisions={rows as ExposureDivision[]} />;
    case "games":
      return <GamesTable games={rows as ExposureGame[]} />;
    case "teams":
      return <TeamsTable teams={rows as ExposureTeam[]} onViewPlayers={onViewPlayers} />;
    case "standings":
      return <StandingsTable standings={rows as ExposureStanding[]} />;
    case "venues":
      return <VenuesTable venues={rows as ExposureVenue[]} />;
  }
}

// ─── Modal ──────────────────────────────────────────────────────────────────────

export default function ExposureEventModal({ event, initialView, onClose }: ExposureEventModalProps) {
  const [view, setView] = useState<ExposureEventView>(initialView);
  const [display, setDisplay] = useState<"Pool" | "Bracket">("Pool");
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Players drill-down (opened from a Teams row) — rendered in place over the tab view.
  const [playersTeam, setPlayersTeam] = useState<ExposureTeam | null>(null);
  const [players, setPlayers] = useState<ExposurePlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState<string | null>(null);

  // Escape-to-close + body-scroll lock while open.
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [event, onClose]);

  const eventId = event?.id;

  // Fetch whenever the event, view, or (standings) display changes.
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const endpoint =
      view === "brackets"
        ? routes.api.proxyExposureEventDivisions(eventId)
        : view === "games"
          ? routes.api.proxyExposureEventGames(eventId)
          : view === "teams"
            ? routes.api.proxyExposureEventTeams(eventId)
            : view === "standings"
              ? routes.api.proxyExposureEventStandings(eventId)
              : routes.api.proxyExposureEventVenues(eventId);

    apiCall<ExposureListResponse<unknown>>({
      endpoint,
      method: "GET",
      data: view === "standings" ? { display } : undefined,
    }).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setRows(result.data.data ?? []);
        setError(null);
      } else {
        setRows([]);
        setError(result.message || "Failed to load.");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [eventId, view, display]);

  // Fetch a team's players when the user drills in from the Teams table.
  const playersTeamId = playersTeam?.id;
  useEffect(() => {
    if (!playersTeamId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayersLoading(true);
    apiCall<ExposureListResponse<ExposurePlayer>>({
      endpoint: routes.api.proxyExposureTeamPlayers(playersTeamId),
      method: "GET",
    }).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setPlayers(result.data.data ?? []);
        setPlayersError(null);
      } else {
        setPlayers([]);
        setPlayersError(result.message || "Failed to load.");
      }
      setPlayersLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [playersTeamId]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[960px] max-h-[85vh] flex flex-col bg-[#0B1C2D] text-white border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 shrink-0">
          <div className="min-w-0">
            <h2 className="text-white text-2xl font-extrabold font-display uppercase truncate">{event.name}</h2>
            <p className="text-white/40 text-xs mt-1">
              {[event.city, event.state].filter(Boolean).join(", ") || "Exposure event"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-9 shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 shrink-0">
          <div className="relative h-11 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
            <div className="flex items-start h-full gap-1">
              {VIEW_TABS.map((t) => {
                const isActive = view === t.view;
                return (
                  <button
                    key={t.view}
                    type="button"
                    onClick={() => {
                      if (t.view === view) return;
                      setView(t.view);
                      setPlayersTeam(null);
                      setRows([]); // drop previous view's rows (wrong shape → Brackets crashes)
                      setLoading(true); // show loader until the new view's fetch resolves
                    }}
                    className="px-3 flex flex-col items-center gap-3 relative h-full justify-end"
                  >
                    <span
                      className={cn(
                        "text-sm font-medium pb-3 whitespace-nowrap",
                        isActive ? "text-white" : "text-white/60 hover:text-white transition-colors"
                      )}
                    >
                      {t.label}
                    </span>
                    <div
                      className={cn(
                        "absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-opacity",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                      style={{ background: "var(--gradient-cta)" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-auto">
          {playersTeam ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setPlayersTeam(null)}
                className="inline-flex items-center gap-1 self-start text-white/60 hover:text-white text-sm mb-3 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                Back to Teams
              </button>
              <h3 className="text-white text-sm font-semibold mb-3">
                Players · <span className="text-white/70">{playersTeam.name}</span>
              </h3>
              {playersLoading && (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                </div>
              )}
              {!playersLoading && playersError && (
                <div className="flex justify-center items-center py-16 text-white/40 text-sm">{playersError}</div>
              )}
              {!playersLoading && !playersError && <PlayersTable players={players} />}
            </div>
          ) : (
            <>
              {view === "standings" && (
                <div className="flex items-center gap-2 mb-4">
                  {(["Pool", "Bracket"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDisplay(d)}
                      className={cn(
                        "h-9 px-4 rounded-lg outline outline-1 text-sm font-medium transition-colors",
                        display === d
                          ? "bg-white/20 outline-white/40 text-white"
                          : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                </div>
              )}
              {!loading && error && (
                <div className="flex justify-center items-center py-16 text-white/40 text-sm">{error}</div>
              )}
              {!loading && !error && renderView(view, rows, setPlayersTeam)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
