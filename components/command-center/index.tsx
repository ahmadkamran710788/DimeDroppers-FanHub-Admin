"use client";

import toast from "react-hot-toast";
import Button from "@/components/common/button";
import StatCard from "@/components/common/stat-card";
import { COMMAND_STATS } from "@/components/command-center/data";
import EventHero from "@/components/command-center/event-hero";
import GameCards from "@/components/command-center/game-cards";
import ReadinessCard from "@/components/command-center/readiness-card";

// Event overview and Game Day Mode have no screens yet.
const comingSoon = () => toast("Coming soon.");

// Tournament Command Center: one real-time view of live games, requests and fans
// (sample data until the tournament operations API exists).
export default function CommandCenterPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Tournament Command Center
          </h2>
          <p className="text-base leading-[26px]">
            Operate the tournament from one real-time view: games, venues, streams, fans, sponsor obligations, ticketing and revenue.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button variant="ghost" label="Event Overview" onClick={comingSoon} />
          <Button variant="cta" label="Open Game Day Mode" className="whitespace-nowrap" onClick={comingSoon} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-10">
        <EventHero />
        <ReadinessCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-10">
        {COMMAND_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <GameCards />
    </div>
  );
}
