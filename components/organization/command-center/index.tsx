"use client";

import { useState } from "react";
import StatCard from "@/components/common/stat-card";
import { commandStats } from "@/components/organization/command-center/command-stats";
import EventSelect from "@/components/organization/event-select";
import EventHero from "@/components/organization/command-center/event-hero";
import GameCards from "@/components/organization/command-center/game-cards";
import ReadinessCard from "@/components/organization/command-center/readiness-card";
import { useCommandCenterOverview } from "@/components/organization/command-center/use-command-center-overview";
import { orgKindOf, useAuth, type OrgKind } from "@/context/auth";

// Title and line under it, by the signed-in organisation's type (/me organizationType); a plain
// "Command Center" until the profile has loaded.
const HEADING: Record<
  OrgKind | "unknown",
  { title: string; description: string }
> = {
  tournament: {
    title: "Tournament Command Center",
    description:
      "Operate the tournament from one real-time view: games, venues, streams, fans, sponsor obligations, ticketing and revenue.",
  },
  school: {
    title: "School Command Center",
    description:
      "Run game day from one real-time view: games, streams, fans, sponsors, ticketing and revenue.",
  },
  unknown: {
    title: "Command Center",
    description:
      "One real-time view of your games, streams, fans, sponsors, ticketing and revenue.",
  },
};

// Command Center: one real-time view of live games, requests and fans, all from the command-center
// API (overview for the hero, stat cards and Event Readiness; live-games for the strip).
export default function CommandCenterPage() {
  const { org } = useAuth();
  const kind = orgKindOf(org);
  const heading = HEADING[kind ?? "unknown"];
  // The tournament event picked on the right of the title ("" = all events).
  const [eventId, setEventId] = useState("");
  // The stat cards, readiness, hero and live games follow the picked event (all events when none).
  const { overview, loading } = useCommandCenterOverview(eventId);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            {heading.title}
          </h2>
          <p className="text-base leading-[26px]">{heading.description}</p>
        </div>
        {kind === "tournament" && (
          <EventSelect value={eventId} onChange={setEventId} />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-10">
        <EventHero overview={overview} />
        <ReadinessCard
          readiness={overview?.readiness ?? null}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-10">
        {commandStats(overview).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <GameCards eventId={eventId} />
    </div>
  );
}
