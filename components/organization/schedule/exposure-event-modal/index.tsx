"use client";

import { cn } from "@/utils/cn";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import GameScheduleView from "@/components/organization/schedule/game-schedule-view";
import {
  BracketsTable,
  PlayersTable,
  StandingsTable,
  TeamsTable,
  VenuesTable,
} from "@/components/organization/exposure-tables";
import type {
  ExposureEvent,
  ExposureEventView,
  ExposureListResponse,
  ExposureDivision,
  ExposureGame,
  ExposureTeam,
  ExposureStanding,
  ExposureVenue,
  ExposurePlayer,
} from "@/utils/types/exposure-event";
import { ChevronLeft, Loader2, X } from "lucide-react";
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

function renderView(
  view: ExposureEventView,
  rows: unknown[],
  onViewPlayers: (team: ExposureTeam) => void
): ReactNode {
  switch (view) {
    case "brackets":
      return <BracketsTable divisions={rows as ExposureDivision[]} />;
    case "games":
      return <GameScheduleView games={rows as ExposureGame[]} />;
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
        ? routes.api.exposureEventDivisions(eventId)
        : view === "games"
          ? routes.api.exposureEventGames(eventId)
          : view === "teams"
            ? routes.api.exposureEventTeams(eventId)
            : view === "standings"
              ? routes.api.exposureEventStandings(eventId)
              : routes.api.exposureEventVenues(eventId);

    apiCall<ExposureListResponse<unknown>>({
      endpoint,
      method: "GET",
      data: view === "standings" ? { display: "Pool" } : undefined,
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
  }, [eventId, view]);

  // Fetch a team's players when the user drills in from the Teams table.
  const playersTeamId = playersTeam?.id;
  useEffect(() => {
    if (!playersTeamId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayersLoading(true);
    apiCall<ExposureListResponse<ExposurePlayer>>({
      endpoint: routes.api.exposureTeamPlayers(playersTeamId),
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
