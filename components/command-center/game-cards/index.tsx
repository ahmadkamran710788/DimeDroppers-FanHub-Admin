"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/loader";
import { PREVIEW_LIVE_GAMES, PREVIEW_SCORES } from "@/components/command-center/data";
import GameCard, { gamePhase } from "@/components/command-center/game-cards/game-card";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";

// How often the live status is re-derived from the clock.
const TICK_MS = 30_000;

// Command Center Live Games: the org's games that are in play right now.
export default function GameCards() {
  const { savedSchool } = useSetup();
  const [games, setGames] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Games from yesterday on, so one that started before midnight still shows while it runs.
  useEffect(() => {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let cancelled = false;
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.proxyListSchedules,
      method: "GET",
      data: { page: 1, limit: 50, sortOrder: "asc", from },
    }).then((result) => {
      if (cancelled) return;
      setGames(result.success ? (result.data?.data?.[0]?.items ?? []) : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // TEMPORARY: preview games first, until real games go live.
  const live = [...PREVIEW_LIVE_GAMES, ...games].filter((g) => gamePhase(g, now) === "live");

  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-5 bg-surface-07 backdrop-blur-[24px]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Live Games</h3>
        <span className="text-xs text-white/50 whitespace-nowrap">{`${live.length} live now`}</span>
      </div>
      {loading ? (
        <Loader />
      ) : live.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">No games are live right now.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {live.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              phase="live"
              homeName={savedSchool?.name || "My Team"}
              homeLogo={savedSchool?.logoUrl}
              score={PREVIEW_SCORES[game.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
