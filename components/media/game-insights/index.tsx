"use client";

import { useState } from "react";
import Image from "next/image";
import SegmentedControl from "@/components/common/segmented-control";
import type { InsightPeriod, MediaGame, TeamInsight } from "@/components/media/data";

const PERIODS: readonly InsightPeriod[] = ["All", "H1", "H2"];

function TeamInsightCard({ insight }: { insight: TeamInsight }) {
  return (
    <article className="rounded-[14px] bg-white/[0.06] p-5 sm:p-6 flex flex-col gap-5 text-white">
      <header className="flex items-start gap-4 pb-5 border-b border-white/15">
        <Image src={insight.team.logo} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-xl font-medium leading-tight">{insight.team.shortName}</h4>
            <span className="shrink-0 text-base font-medium whitespace-nowrap">{`${insight.points} PTS`}</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            {`${insight.season} • ${insight.location} • ${insight.players} players`}
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h5 className="flex items-center gap-3 text-base font-semibold uppercase tracking-wide">
          <span aria-hidden>💪</span>
          Strengths
        </h5>
        <ul className="flex flex-col gap-4 pl-5 list-disc marker:text-white">
          {insight.strengths.map((s) => (
            <li key={s.title} className="text-base leading-7 text-white/90">
              {`${s.title}: ${s.text}`}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

// "Insights" in Game Details: per-team strengths for the whole game or either half.
export default function GameInsights({ game }: { game: MediaGame }) {
  const [period, setPeriod] = useState<InsightPeriod>("All");
  const insights = game.insights?.[period] ?? [];

  if (!game.insights) {
    return <p className="py-10 text-center text-sm text-white/50">Insights will appear here after the game.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        options={PERIODS}
        active={period}
        onChange={setPeriod}
        ariaLabel="Game period"
        variant="light"
        fullWidth
      />
      {insights.length > 0 ? (
        insights.map((i) => <TeamInsightCard key={i.team.name} insight={i} />)
      ) : (
        <p className="py-10 text-center text-sm text-white/50">No insights for this period yet.</p>
      )}
    </div>
  );
}
