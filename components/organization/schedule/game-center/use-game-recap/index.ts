"use client";

import { useEffect, useState } from "react";
import type { GameRecap, GameTeam, TeamLeader } from "@/components/organization/schedule/game-center/data";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { GameRecapData, RecapLeader, RecapSide } from "@/utils/types/command-center";

export interface LoadedRecap {
  home: GameTeam;
  away: GameTeam;
  // Hero badge, e.g. "Final".
  status: string;
  recap: GameRecap;
}

const STATUS: Record<string, string> = { final: "Final", live: "Live", pending: "Upcoming" };

const team = (side: RecapSide, score: number): GameTeam => ({ name: side.School ?? "TBD", logo: side.Logo, score });

const leader = (l: RecapLeader | null): TeamLeader | null =>
  l && {
    name: l.playerName,
    stats: [
      { value: l.points, label: "PTS" },
      { value: l.rebounds, label: "REB" },
      { value: l.assists, label: "AST" },
      { value: l.blocks, label: "BLK" },
    ],
  };

const toRecap = (d: GameRecapData): LoadedRecap => ({
  home: team(d.Home, d.details.score.home),
  away: team(d.Away, d.details.score.away),
  status: STATUS[d.details.matchStatus] ?? d.details.matchStatus,
  recap: {
    headline: d.recap.headline,
    date: d.details.date,
    venue: d.details.venue ?? "—",
    paragraphs: d.recap.paragraphs,
    leaders: { home: leader(d.leaders.home), away: leader(d.leaders.away) },
  },
});

// The game's recap from GET /command-center/games/{id}/recap. The first call for a game can take a few
// seconds while the recap is written. `recap` stays null when it failed (e.g. 404 for another org's game).
export function useGameRecap(gameId: string, enabled: boolean) {
  const [recap, setRecap] = useState<LoadedRecap | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    apiCall<{ data: GameRecapData[] }>({ endpoint: routes.api.commandCenterGameRecap(gameId), method: "GET" }).then((result) => {
      if (cancelled) return;
      const d = result.success ? result.data?.data?.[0] : undefined;
      setRecap(d ? toRecap(d) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId, enabled]);

  return { recap, loading };
}
