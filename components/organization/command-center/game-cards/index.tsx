"use client";

import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/common/loader";
import GameCard from "@/components/organization/command-center/game-cards/game-card";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { LiveGame, LiveGamesPage } from "@/utils/types/command-center";

// How often the live scores and viewer counts are refetched.
const POLL_MS = 30_000;
const LIMIT = 20;

async function fetchLiveGames(eventId: string): Promise<LiveGamesPage> {
  const query = new URLSearchParams({ limit: String(LIMIT), ...(eventId && { eventId }) });
  const res = await backendFetch(`${routes.api.commandCenterLiveGames}?${query}`);
  const body = res.ok ? ((await res.json().catch(() => null)) as { data?: LiveGamesPage[] } | null) : null;
  const page = body?.data?.[0];
  // Thrown so a failed poll keeps the last games on screen.
  if (!page) throw new Error("Couldn't load the live games.");
  return page;
}

// Command Center Live Games: the org's games in play right now, from GET /command-center/live-games,
// polled with TanStack Query (paused while the tab is hidden). backendFetch, not apiCall, so a failed
// poll doesn't toast. `eventId` (a tournament's FanHubSchoolEvent id, "" for all) keeps the strip to
// that event; each event has its own query, so a switch shows the loader, not the old event's games.
export default function GameCards({ eventId = "" }: { eventId?: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["command-center", "live-games", eventId],
    queryFn: () => fetchLiveGames(eventId),
    refetchInterval: POLL_MS,
  });
  const loading = isPending;
  const games: LiveGame[] = data?.games ?? [];
  const total = data?.total ?? 0;

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
