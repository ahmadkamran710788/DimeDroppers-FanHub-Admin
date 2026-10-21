"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/loader";
import GameCard from "@/components/organization/command-center/game-cards/game-card";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { LiveGame, LiveGamesPage } from "@/utils/types/command-center";

// How often the live scores and viewer counts are refetched.
const POLL_MS = 30_000;
const LIMIT = 20;

// Command Center Live Games: the org's games in play right now, from GET /command-center/live-games.
// Polled with backendFetch, since apiCall would answer repeat GETs from its cache.
// `eventId` (a tournament's FanHubSchoolEvent id, "" for all) keeps the strip to that event.
export default function GameCards({ eventId = "" }: { eventId?: string }) {
  // The latest answer and the event it is for, so a switch shows the loader, not the old event's games.
  const [loaded, setLoaded] = useState<{ eventId: string; games: LiveGame[]; total: number } | null>(null);
  const loading = loaded?.eventId !== eventId;
  const games = loading ? [] : (loaded?.games ?? []);
  const total = loading ? 0 : (loaded?.total ?? 0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const query = new URLSearchParams({ limit: String(LIMIT), ...(eventId && { eventId }) });
      const res = await backendFetch(`${routes.api.commandCenterLiveGames}?${query}`).catch(() => null);
      const body = res?.ok ? ((await res.json().catch(() => null)) as { data?: LiveGamesPage[] } | null) : null;
      if (cancelled) return;
      // A failed poll keeps the last games on screen.
      const page = body?.data?.[0];
      setLoaded((prev) =>
        page
          ? { eventId, games: page.games, total: page.total }
          : prev?.eventId === eventId
            ? prev
            : { eventId, games: [], total: 0 }
      );
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [eventId]);

  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-5 bg-surface-07 backdrop-blur-[24px]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Live Games</h3>
        <span className="text-xs text-white/50 whitespace-nowrap">{`${total} live now`}</span>
      </div>
      {loading ? (
        <Loader />
      ) : games.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">No games are live right now.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}
