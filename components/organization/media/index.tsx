"use client";

import EventSelect from "@/components/organization/event-select";
import GameDetails from "@/components/organization/media/game-details";
import GamesBrowser from "@/components/organization/media/games-browser";
import GameThread from "@/components/organization/media/game-thread";
import { useOrgGames } from "@/components/organization/media/use-org-games";

const CONTENT_TABS = ["Game Thread", "Game Details"] as const;

// Media: pick a game on the left, see its score, play-by-play thread and recap on the right.
// - School: its own games (GET /schedules, with results and opponent logos).
// - Tournament: an event is picked at the top (the newest first), then its games (GET
//   /exposure/schedules?eventId=).
// Either way, a game's thread, recap and insights come from the game-detail endpoints by its schedule id.
export default function MediaPage() {
  const { games, loading, isTournament, event, setEvent, noEvents } = useOrgGames();

  return (
    <GamesBrowser
      title="Media"
      description="View media, highlights and game content for your games."
      tabs={CONTENT_TABS}
      games={games}
      loading={loading}
      emptyText={isTournament && noEvents ? "Pick an event to see its games." : undefined}
      headerAction={
        isTournament && (
          <EventSelect
            value={event?.id ?? ""}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
        )
      }
      renderContent={(tab, game) =>
        tab === "Game Thread" ? (
          <GameThread game={game} />
        ) : (
          <GameDetails game={game} />
        )
      }
    />
  );
}
