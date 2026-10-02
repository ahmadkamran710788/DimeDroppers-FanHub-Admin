"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Tabs from "@/components/common/tabs";
import { SAMPLE_GAME, type GameTeam } from "@/components/schedule/game-center/data";
import HighlightsSection from "@/components/schedule/game-center/highlights";
import RecapSection from "@/components/schedule/game-center/recap";
import { routes } from "@/utils/routes";

const TABS = ["Recap", "Insights", "Video", "Stats", "Plays"] as const;
export type GameCenterTab = (typeof TABS)[number];

// URL for each built tab, so switching tabs keeps a shareable link.
const TAB_ROUTE: Partial<Record<GameCenterTab, (gameId: string) => string>> = {
  Recap: routes.ui.gameRecap,
  Video: routes.ui.gameHighlights,
};

// Insights, Stats and Plays land with their own designs.
const comingSoon = () => toast("Coming soon.");

function TeamBadge({ team, reverse = false }: { team: GameTeam; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-4 lg:gap-6 ${reverse ? "flex-row-reverse sm:flex-row" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={team.logo} alt="" className="size-16 lg:size-24 shrink-0 rounded-full object-cover" />
      <span className="max-w-[200px] font-display font-extrabold text-lg lg:text-2xl uppercase leading-tight text-white">
        {team.name}
      </span>
    </div>
  );
}

interface GameCenterPageProps {
  // Selected schedule game; the sample data stands in until a game center API exists.
  gameId: string;
  initialTab: GameCenterTab;
}

// Per-game screen opened from the schedule row's details panel: sponsor bar, score hero and tabs.
export default function GameCenterPage({ gameId, initialTab }: GameCenterPageProps) {
  const [tab, setTab] = useState<GameCenterTab>(initialTab);
  const game = SAMPLE_GAME;

  const changeTab = (t: GameCenterTab) => {
    const route = TAB_ROUTE[t];
    if (!route) return comingSoon();
    setTab(t);
    // Keep the address bar in sync without a navigation round-trip.
    window.history.replaceState(null, "", route(gameId));
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={routes.ui.schedule}
        className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
      >
        <ArrowLeft className="size-6" strokeWidth={1.5} />
        Back to Schedule
      </Link>

      <div className="rounded-[8px] overflow-hidden border border-white/10 bg-[#0B1424]">
        {/* Game bar: sponsor, matchup, section tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-10 px-6 pt-4 border-b border-white/10">
          <div className="flex items-center gap-4 pb-4 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.sponsor.logo} alt={game.sponsor.name} className="h-8 w-auto shrink-0" />
            <span className="h-8 w-px bg-white/20 shrink-0" />
            <span className="text-base font-medium text-white truncate">{`${game.home.name} vs ${game.away.name}`}</span>
          </div>
          <Tabs tabs={TABS} active={tab} onChange={changeTab} className="border-b-0 overflow-x-auto" />
        </div>

        {/* Score hero */}
        <div className="relative px-6 py-8 lg:py-10 flex flex-col items-center gap-6 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/highlights/hero-bg.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover opacity-70"
          />
          <div className="relative flex items-center gap-3 text-sm font-semibold text-white">
            Presented by
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.sponsor.presentedLogo} alt={game.sponsor.name} className="h-10 lg:h-12 w-auto" />
          </div>
          <div className="relative w-full flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-16">
            <TeamBadge team={game.home} />
            <div className="flex items-center gap-4 lg:gap-6 font-display font-extrabold text-white">
              <span className="text-5xl lg:text-7xl leading-none">{game.home.score}</span>
              <span className="h-12 w-px bg-white/20" />
              <span className="px-5 py-2 rounded-[8px] bg-[#0B1424]/80 border border-white/10 font-sans text-base font-semibold uppercase">
                {game.status}
              </span>
              <span className="h-12 w-px bg-white/20" />
              <span className="text-5xl lg:text-7xl leading-none">{game.away.score}</span>
            </div>
            <TeamBadge team={game.away} reverse />
          </div>
        </div>

        {tab === "Recap" ? (
          <RecapSection recap={game.recap} home={game.home} away={game.away} onShare={share} />
        ) : (
          <HighlightsSection highlights={game.highlights} onPlay={comingSoon} onSeeAll={comingSoon} />
        )}
      </div>
    </div>
  );
}
