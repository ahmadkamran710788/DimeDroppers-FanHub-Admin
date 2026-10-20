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
export default function GameCards() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await backendFetch(`${routes.api.commandCenterLiveGames}?limit=${LIMIT}`).catch(() => null);
      const body = res?.ok ? ((await res.json().catch(() => null)) as { data?: LiveGamesPage[] } | null) : null;
      if (cancelled) return;
      // A failed poll keeps the last games on screen.
      const page = body?.data?.[0];
      if (page) {
        setGames(page.games);
        setTotal(page.total);
      }
      setLoading(false);
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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
