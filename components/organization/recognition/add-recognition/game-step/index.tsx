"use client";

import Loader from "@/components/common/loader";
import EventSelect from "@/components/organization/event-select";
import type { MediaGame } from "@/components/organization/media/data";
import GameCard from "@/components/organization/media/game-card";
import { useOrgGames } from "@/components/organization/media/use-org-games";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";

interface GameStepProps {
  gameId: string;
  onGame: (game: MediaGame) => void;
  error?: string;
}

// Step 2 of Add Recognition: the game the shout-out is for. A tournament first picks the event (the
// same picker as every other page), then one of its games; a school picks from its own games.
export default function GameStep({ gameId, onGame, error }: GameStepProps) {
  const { games = [], loading, isTournament, event, setEvent, noEvents } = useOrgGames();

  return (
    <section className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SectionHeading
          step={2}
          title="Choose the Game"
          description={isTournament ? "Pick the event, then the game this shout-out is for." : "Pick the game this shout-out is for."}
        />
        {isTournament && (
          <EventSelect
            value={event?.id ?? ""}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}

      {loading ? (
        <Loader className="m-10" />
      ) : games.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">
          {isTournament && (noEvents || !event) ? "Pick an event to see its games." : "No games to show yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} selected={g.id === gameId} onSelect={() => onGame(g)} />
          ))}
        </div>
      )}
    </section>
  );
}
