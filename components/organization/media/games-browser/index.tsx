"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import SegmentedControl from "@/components/common/segmented-control";
import Loader from "@/components/common/loader";
import Tabs from "@/components/common/tabs";
import { SAMPLE_GAMES, type MediaGame } from "@/components/organization/media/data";
import GameCard from "@/components/organization/media/game-card";
import GameHero from "@/components/organization/media/game-hero";

const LIST_TABS = ["All Games", "Live & Upcoming", "Past Games"] as const;
type ListTab = (typeof LIST_TABS)[number];

interface GamesBrowserProps<T extends string> {
  title: string;
  description: string;
  // Content tabs under the score hero (a single tab still renders as the active pill).
  tabs: readonly T[];
  renderContent: (tab: T, game: MediaGame) => ReactNode;
  // The games to list; the sample games when omitted. `loading` shows a loader in their place.
  games?: MediaGame[];
  loading?: boolean;
  // Beside the title, e.g. a tournament's event picker.
  headerAction?: ReactNode;
  // Shown when there are no games; "No games here yet." without it.
  emptyText?: string;
  // A "Load more" button under the list while there are more games to read.
  loadMore?: { hasMore: boolean; loading: boolean; onLoad: () => void };
}

// Games list on the left; the selected game's score hero and tabbed content on the right.
// Shared by Media (Game Thread / Game Details) and Digital Collectibles (Game Collectibles).
export default function GamesBrowser<T extends string>({
  title,
  description,
  tabs,
  renderContent,
  games: allGames = SAMPLE_GAMES,
  loading = false,
  headerAction,
  emptyText = "No games here yet.",
  loadMore,
}: GamesBrowserProps<T>) {
  const [listTab, setListTab] = useState<ListTab>("All Games");
  const [selectedId, setSelectedId] = useState("");
  const [contentTab, setContentTab] = useState<T>(tabs[0]);

  const games = useMemo(
    () =>
      allGames.filter((g) =>
        listTab === "Past Games" ? g.status === "final" : listTab === "Live & Upcoming" ? g.status !== "final" : true
      ),
    [allGames, listTab]
  );
  const selected = allGames.find((g) => g.id === selectedId) ?? games[0] ?? allGames[0];

  // The tabs sort the games read so far. A tab with none yet keeps reading the next page (behind the loader)
  // until it finds one or the games run out; "Load more" only shows under a tab that has games.
  const searching = !loading && games.length === 0 && !!loadMore?.hasMore;
  const busy = loadMore?.loading ?? false;
  const onLoad = loadMore?.onLoad;
  useEffect(() => {
    if (searching && !busy) onLoad?.();
  }, [searching, busy, onLoad]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 text-white">
          <h2 className="text-[32px] lg:text-[40px] font-bold leading-tight">{title}</h2>
          <p className="text-base lg:text-lg leading-[26px]">{description}</p>
        </div>
        {headerAction}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-4 items-start">
        {/* Games list. On wide screens it scrolls on its own and stays in view while the page scrolls the
            selected game's content, so picking another game never means scrolling back up. */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <Tabs tabs={LIST_TABS} active={listTab} onChange={setListTab} className="mt-6" />
          <div className="flex flex-col gap-3 xl:max-h-[calc(100dvh-200px)] xl:overflow-y-auto xl:pr-2 xl:pb-2">
            {loading || searching ? (
              <Loader className="m-6" />
            ) : (
              games.map((g) => (
                <GameCard key={g.id} game={g} selected={g.id === selected?.id} onSelect={() => setSelectedId(g.id)} />
              ))
            )}
            {!loading && !searching && games.length === 0 && <p className="py-10 text-center text-sm text-white/50">{emptyText}</p>}
            {!loading && games.length > 0 && loadMore?.hasMore && (
              <Button
                label={loadMore.loading ? "Loading…" : "Load more"}
                variant="secondary"
                onClick={loadMore.onLoad}
                disabled={loadMore.loading}
                className="self-center"
              />
            )}
          </div>
        </div>

        {/* Selected game */}
        {selected && (
        <div className="flex flex-col gap-4 min-w-0">
          <GameHero game={selected} />
          <div className="rounded-[12px] border border-white/10 bg-white/[0.04] flex flex-col gap-4 p-4 sm:p-5">
            <SegmentedControl
              options={tabs}
              active={contentTab}
              onChange={setContentTab}
              ariaLabel="Game content"
              fullWidth
              size="lg"
              className="bg-transparent border border-white/15"
            />
            <div>{renderContent(contentTab, selected)}</div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
