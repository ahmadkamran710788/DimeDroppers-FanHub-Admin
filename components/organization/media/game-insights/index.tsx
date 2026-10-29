"use client";

import { useState } from "react";
import Image from "next/image";
import Loader from "@/components/common/loader";
import SegmentedControl from "@/components/common/segmented-control";
import type { InsightPeriod, InsightPoint, MediaGame, TeamInsight } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameInsightsDetail, InsightBullet, InsightScope } from "@/utils/types/game-detail";

const PERIODS: readonly InsightPeriod[] = ["All", "H1", "H2"];
const SCOPE_OF: Record<InsightPeriod, "all" | "h1" | "h2"> = { All: "all", H1: "h1", H2: "h2" };
const FALLBACK_LOGO = "/images/preview-crest.png";

// AI insights come as { label, text }; the rule-based ones as plain lines.
const toPoints = (items: InsightBullet[] | undefined, lines: string[]): InsightPoint[] =>
  items?.length ? items.map((i) => ({ title: i.label, text: i.text })) : lines.map((text) => ({ text }));

// The API's team cards, for one period, in the shape the cards render.
function toTeamInsights(detail: GameInsightsDetail, period: InsightPeriod): TeamInsight[] {
  return (detail.insights?.teams ?? []).map((t) => {
    const side = t.teamSide === "HOME" ? detail.Home : detail.Away;
    const scope: InsightScope | undefined = t.scopes[SCOPE_OF[period]];
    return {
      team: { name: t.teamName, shortName: t.teamName, logo: side.Logo || FALLBACK_LOGO },
      points: scope?.points ?? t.points,
      season: t.season,
      location: t.location,
      players: t.playerCount,
      strengths: toPoints(scope?.strengthItems, scope?.strengths ?? []),
      areasForImprovement: toPoints(scope?.areasForImprovementItems, scope?.areasForImprovement ?? []),
    };
  });
}

function PointList({ heading, emoji, points }: { heading: string; emoji: string; points: InsightPoint[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h5 className="flex items-center gap-3 text-base font-semibold uppercase tracking-wide">
        <span aria-hidden>{emoji}</span>
        {heading}
      </h5>
      <ul className="flex flex-col gap-4 pl-5 list-disc marker:text-white">
        {points.map((s) => (
          <li key={`${s.title}-${s.text.slice(0, 24)}`} className="text-base leading-7 text-white/90">
            {s.title ? `${s.title}: ${s.text}` : s.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamInsightCard({ insight }: { insight: TeamInsight }) {
  const meta = [insight.season, insight.location, insight.players != null ? `${insight.players} players` : null].filter(Boolean);
  return (
    <article className="rounded-[14px] bg-white/[0.06] p-5 sm:p-6 flex flex-col gap-5 text-white">
      <header className="flex items-start gap-4 pb-5 border-b border-white/15">
        <Image
          src={insight.team.logo}
          alt=""
          width={64}
          height={64}
          unoptimized={insight.team.logo.startsWith("http")}
          className="size-16 shrink-0 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-xl font-medium leading-tight">{insight.team.shortName}</h4>
            <span className="shrink-0 text-base font-medium whitespace-nowrap">{`${insight.points} PTS`}</span>
          </div>
          {meta.length > 0 && <p className="text-sm text-white/60 leading-relaxed">{meta.join(" • ")}</p>}
        </div>
      </header>

      {insight.strengths.length > 0 && <PointList heading="Strengths" emoji="💪" points={insight.strengths} />}
      {!!insight.areasForImprovement?.length && (
        <PointList heading="Areas for Improvement" emoji="🎯" points={insight.areasForImprovement} />
      )}
    </article>
  );
}

function InsightsView({ byPeriod }: { byPeriod: (period: InsightPeriod) => TeamInsight[] }) {
  const [period, setPeriod] = useState<InsightPeriod>("All");
  const insights = byPeriod(period);

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl options={PERIODS} active={period} onChange={setPeriod} ariaLabel="Game period" variant="light" fullWidth />
      {insights.length > 0 ? (
        insights.map((i) => <TeamInsightCard key={i.team.name} insight={i} />)
      ) : (
        <p className="py-10 text-center text-sm text-white/50">No insights for this period yet.</p>
      )}
    </div>
  );
}

// A game's insights from GET /game-detail/games/{id}/insights (null until official scoring).
function ApiInsights({ gameId }: { gameId: string }) {
  const { data, error, loading } = useGameDetail<GameInsightsDetail>(routes.api.gameDetailInsights(gameId));
  if (loading) return <Loader className="m-10" />;
  if (!data?.insights) {
    return <p className="py-10 text-center text-sm text-white/50">{error ?? "Insights will appear here after the game."}</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {data.insights.gameDefiningTrend && <p className="text-base leading-7 text-white/85">{data.insights.gameDefiningTrend}</p>}
      <InsightsView byPeriod={(p) => toTeamInsights(data, p)} />
    </div>
  );
}

// "Insights" in Game Details: per-team strengths (and areas for improvement) for the whole game or either half.
export default function GameInsights({ game }: { game: MediaGame }) {
  if (game.fromApi) return <ApiInsights key={game.id} gameId={game.id} />;
  if (!game.insights) {
    return <p className="py-10 text-center text-sm text-white/50">Insights will appear here after the game.</p>;
  }
  return <InsightsView byPeriod={(p) => game.insights?.[p] ?? []} />;
}
