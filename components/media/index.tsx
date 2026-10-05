"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/common/segmented-control";
import Tabs from "@/components/common/tabs";
import { SAMPLE_GAMES } from "@/components/media/data";
import GameCard from "@/components/media/game-card";
import GameDetails from "@/components/media/game-details";
import GameHero from "@/components/media/game-hero";
import GameThread from "@/components/media/game-thread";

const LIST_TABS = ["All Games", "Live & Upcoming", "Past Games"] as const;
type ListTab = (typeof LIST_TABS)[number];

const CONTENT_TABS = ["Game Thread", "Game Details"] as const;
type ContentTab = (typeof CONTENT_TABS)[number];

// Media: pick a game on the left, see its score, play-by-play thread and recap on the right.
export default function MediaPage() {
  const [listTab, setListTab] = useState<ListTab>("All Games");
  const [selectedId, setSelectedId] = useState(SAMPLE_GAMES[0].id);
  const [contentTab, setContentTab] = useState<ContentTab>("Game Thread");

  const games = useMemo(
    () =>
      SAMPLE_GAMES.filter((g) =>
        listTab === "Past Games" ? g.status === "final" : listTab === "Live & Upcoming" ? g.status !== "final" : true
      ),
    [listTab]
  );
  const selected = SAMPLE_GAMES.find((g) => g.id === selectedId) ?? SAMPLE_GAMES[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-white">
        <h2 className="text-[32px] lg:text-[40px] font-bold leading-tight">Media</h2>
        <p className="text-base lg:text-lg leading-[26px]">View media, highlights and game content for your games.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-4 items-start">
        {/* Games list */}
        <div className="flex flex-col gap-4">
          <Tabs tabs={LIST_TABS} active={listTab} onChange={setListTab} className="mt-6" />
          <div className="flex flex-col gap-3">
            {games.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                selected={g.id === selected.id}
                onSelect={() => setSelectedId(g.id)}
              />
            ))}
            {games.length === 0 && <p className="py-10 text-center text-sm text-white/50">No games here yet.</p>}
          </div>
        </div>

        {/* Selected game */}
        <div className="flex flex-col gap-4 min-w-0">
          <GameHero game={selected} />
          <div className="rounded-[12px] border border-white/10 bg-white/[0.04] flex flex-col gap-4 p-4 sm:p-5">
            <SegmentedControl
              options={CONTENT_TABS}
              active={contentTab}
              onChange={setContentTab}
              ariaLabel="Game content"
              fullWidth
              size="lg"
              className="bg-transparent border border-white/15"
            />
            <div>
              {contentTab === "Game Thread" ? <GameThread game={selected} /> : <GameDetails game={selected} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
