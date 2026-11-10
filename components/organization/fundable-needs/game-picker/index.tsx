"use client";

import { useEffect, useState } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import SearchInput from "@/components/common/search-input";
import { HINT } from "@/components/organization/fundable-needs/field-styles";
import { GAMES_PAGE_SIZE, gameCloses, gameTime, gameTitle } from "@/components/organization/fundable-needs/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { NeedGame, Paged } from "@/utils/types/needs";

// Typing waits this long before searching.
const SEARCH_DELAY_MS = 300;

// The games loaded for one search (base); more pages are added to the end.
interface Loaded {
  base: string;
  page: number;
  items: NeedGame[];
  totalPages: number;
  error?: string;
}

interface GamePickerProps {
  value: NeedGame | null;
  onChange: (game: NeedGame | null) => void;
  // Only that team's games (the Team field above); all the school's games without one.
  teamId: string;
  error?: string;
}

// "Home · River City Fieldhouse".
const gameMeta = (game: NeedGame) => [game.homeAway, game.location].filter(Boolean).join(" · ");

// A school's need is for one game that isn't over yet (GET /fanhub/org/needs/games): search and pick it.
export default function GamePicker({ value, onChange, teamId, error }: GamePickerProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Another search or team starts again from the first page.
  const base = `${teamId}|${search}`;
  const [pageBase, setPageBase] = useState(base);
  if (pageBase !== base) {
    setPageBase(base);
    setPage(1);
  }

  useEffect(() => {
    if (value) return;
    let cancelled = false;
    sponsorRequest<Paged<NeedGame>>("GET", routes.api.orgNeedGames, {
      params: { teamId: teamId || undefined, search: search || undefined, page, limit: GAMES_PAGE_SIZE },
    }).then((r) => {
      if (cancelled) return;
      setLoaded((prev) => {
        if (!r.view) return { base, page, items: page > 1 && prev?.base === base ? prev.items : [], totalPages: 0, error: r.message };
        const earlier = page > 1 && prev?.base === base ? prev.items : [];
        return { base, page, items: [...earlier, ...r.view.items], totalPages: r.view.pagination.totalPages };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [value, base, teamId, search, page]);

  if (value) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-base font-medium text-white">
          Game<span className="text-error"> *</span>
        </span>
        <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-[#638BFE]/60 bg-[#638BFE]/10 p-3.5 text-white">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-semibold break-words">{gameTitle(value)}</span>
            <span className="text-[13px] text-white/75">
              {[gameTime(value.utcTime), value.team?.name, gameMeta(value)].filter(Boolean).join(" · ")}
            </span>
            {gameCloses(value) && <span className="text-xs text-white/60">{gameCloses(value)}</span>}
          </div>
          <Button size="sm" variant="outline" label="Change" onClick={() => onChange(null)} className="h-9 px-3" />
        </div>
      </div>
    );
  }

  const current = loaded?.base === base && loaded.page === page ? loaded : null;
  // While the next page loads, keep showing the ones already there.
  const games = loaded?.base === base ? loaded.items : [];

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="need-game-search" className="text-base font-medium text-white">
        Game<span className="text-error"> *</span>
      </label>
      <SearchInput
        id="need-game-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by opponent or title"
        aria-describedby="need-game-hint"
      />
      <div
        className={cn(
          "flex max-h-[320px] flex-col gap-1.5 overflow-y-auto rounded-[8px] border bg-black/20 p-2",
          error ? "border-error" : "border-white/10"
        )}
      >
        {games.map((game) => (
          // A clickable row (picks this game), not an action button.
          <button
            key={game.id}
            type="button"
            onClick={() => onChange(game)}
            className="flex w-full flex-col items-start gap-1 rounded-[8px] px-3 py-2.5 text-left text-white transition-colors hover:bg-white/10"
          >
            <span className="font-semibold">{gameTitle(game)}</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-white/70">
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                {gameTime(game.utcTime)}
              </span>
              {game.team?.name && <span>{game.team.name}</span>}
              {gameMeta(game) && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {gameMeta(game)}
                </span>
              )}
            </span>
          </button>
        ))}
        {!current ? (
          <Loader className="py-3" />
        ) : current.error ? (
          <p className="px-3 py-2 text-sm text-white/60">{`Couldn't load your games: ${current.error}`}</p>
        ) : games.length === 0 ? (
          <p className="px-3 py-2 text-sm text-white/60">
            {search ? "No upcoming games match that search." : "No upcoming games on your schedule."}
          </p>
        ) : (
          page < current.totalPages && (
            <Button
              size="sm"
              variant="text"
              label="Load more"
              onClick={() => setPage((p) => p + 1)}
              className="self-center text-[13px] font-semibold text-white/80 hover:text-white"
            />
          )
        )}
      </div>
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        <p id="need-game-hint" className={HINT}>
          Only games that aren&apos;t over yet. Funding and spending close 3 hours after the game starts.
        </p>
      )}
    </div>
  );
}
