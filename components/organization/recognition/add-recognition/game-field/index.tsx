"use client";

import { Trophy } from "lucide-react";
import Select from "@/components/common/select";
import EventSelect from "@/components/organization/event-select";
import type { MediaGame } from "@/components/organization/media/data";
import { useOrgGames } from "@/components/organization/media/use-org-games";

interface GameFieldProps {
  gameId: string;
  onGame: (game: MediaGame) => void;
  error?: string;
}

const gameLabel = (g: MediaGame) =>
  `${g.home.shortName} vs ${g.away.shortName} · ${new Date(g.start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${new Date(g.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

// The game of a "Game" template: a tournament picks the event (the shared picker) then one of its games;
// a school picks one of its own games.
export default function GameField({ gameId, onGame, error }: GameFieldProps) {
  const { games = [], loading, isTournament, event, setEvent, noEvents } = useOrgGames({ teamNames: true });

  return (
    <div className="flex flex-col gap-3">
      {isTournament && (
        <EventSelect
          value={event?.id ?? ""}
          onChange={(id, name) => setEvent(id ? { id, name } : null)}
          allowAll={false}
          selectedName={event?.name}
        />
      )}
      <Select
        variant="dark"
        label="Game"
        name="gameId"
        required
        value={gameId}
        onChange={(e) => {
          const game = games.find((g) => g.id === e.target.value);
          if (game) onGame(game);
        }}
        options={games.map((g) => ({ label: gameLabel(g), value: g.id }))}
        placeholder={
          loading ? "Loading…" : isTournament && noEvents ? "Pick an event first" : games.length ? "Choose a game" : "No games yet"
        }
        icon={<Trophy className="size-5" strokeWidth={2} />}
        disabled={loading || games.length === 0}
        error={error}
        labelClassName="text-white text-sm"
      />
    </div>
  );
}
