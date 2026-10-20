"use client";

import StatCard from "@/components/common/stat-card";
import { commandStats } from "@/components/command-center/command-stats";
import EventHero from "@/components/command-center/event-hero";
import GameCards from "@/components/command-center/game-cards";
import ReadinessCard from "@/components/command-center/readiness-card";
import { useCommandCenterOverview } from "@/components/command-center/use-command-center-overview";

// Tournament Command Center: one real-time view of live games, requests and fans, all from the
// command-center API (overview for the hero, stat cards and Event Readiness; live-games for the strip).
export default function CommandCenterPage() {
  const { overview, loading } = useCommandCenterOverview();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Tournament Command Center
        </h2>
        <p className="text-base leading-[26px]">
          Operate the tournament from one real-time view: games, venues, streams, fans, sponsor obligations, ticketing and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-10">
        <EventHero overview={overview} />
        <ReadinessCard readiness={overview?.readiness ?? null} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-10">
        {commandStats(overview).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <GameCards />
    </div>
  );
}
