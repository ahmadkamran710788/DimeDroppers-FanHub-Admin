"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import StatCard, { type Stat } from "@/components/common/stat-card";
import ActivatedSummary, { type ActivatedDone } from "@/components/sponsor/checkout/activated-summary";
import { activeActivations, sponsorRequest, type ActiveActivations } from "@/components/sponsor/sponsor-api";
import { CARD, HINT, LINK_BUTTON, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { cartItemKey } from "@/context/sponsor-cart";
import { useSponsorStores } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import InventoryMix from "@/components/sponsor/campaign-planner/inventory-mix";
import LaunchPanel from "@/components/sponsor/campaign-planner/launch-panel";
import MarketBreakdown from "@/components/sponsor/campaign-planner/market-breakdown";
import PlacementsTable, { ALL_MARKETS } from "@/components/sponsor/campaign-planner/placements-table";
import PlanComposer, { type FieldErrors } from "@/components/sponsor/campaign-planner/plan-composer";
import { planEntries } from "@/components/sponsor/campaign-planner/plan-items";
import { summarizePlan, type PlanSummary } from "@/components/sponsor/campaign-planner/summarize-plan";
import { PLAN_STAT_TINTS, fieldOfPath, type PlannerTier } from "@/components/sponsor/campaign-planner/data";
import type { SponsorSearchFilters } from "@/utils/types/sponsor-packages";
import type { SponsorPlan, SponsorPlanRequest } from "@/utils/types/sponsor-plan";

// The four stat cards over the plan (fan, as the API counts it: app followers of the organizations).
function planStats(summary: PlanSummary): Stat[] {
  const markets = summary.markets.filter((m) => m.totalCents > 0).length;
  return [
    {
      label: "Total cost",
      value: dollars(summary.totalCents),
      tint: PLAN_STAT_TINTS.cost,
      caption: `${dollars(summary.remainingCents)} of ${dollars(summary.budgetCents)} left`,
    },
    {
      label: "Organizations",
      value: String(summary.organizationCount),
      tint: PLAN_STAT_TINTS.organizations,
      caption: `across ${plural(markets, "market")}`,
    },
    {
      label: "Est. fan reach",
      value: summary.fanReach.toLocaleString("en-US"),
      tint: PLAN_STAT_TINTS.reach,
      caption: "from organizations’ follower data",
    },
    {
      label: "Cost per fan",
      // "—" when no fans are counted (the API sends null).
      value: summary.costPerFanCents === null ? "—" : dollars(summary.costPerFanCents),
      tint: PLAN_STAT_TINTS.costPerFan,
      caption: "per season",
    },
  ];
}

interface CampaignPlannerProps {
  // The signed-in sponsor's brand type, shown on the pill.
  tier: PlannerTier;
}

// Dime AI's Campaign Planner (national and regional brands): the sponsor sets where, the budget, season, goal,
// sports and genders (or describes the campaign and POST /plans/prompt fills them in), and POST /plans/recommend
// answers one plan across organizations (schools, clubs and leagues as a whole; tournaments by their events near
// the locations). Lines can be removed on screen; the lines left are bought together or put in the cart (the
// Launch panel). Nothing is saved.
export default function CampaignPlanner({ tier }: CampaignPlannerProps) {
  const stores = useSponsorStores();
  const [filters, setFilters] = useState<SponsorSearchFilters | null>(null);
  const [filtersFailed, setFiltersFailed] = useState(false);
  const [filterLoads, setFilterLoads] = useState(0);
  const [plan, setPlan] = useState<SponsorPlan | null>(null);
  const [building, setBuilding] = useState(false);
  // The last request's refusal that belongs to no field (no organisations found, rate limit…).
  const [problem, setProblem] = useState<string | null>(null);
  const [market, setMarket] = useState(ALL_MARKETS);
  // Indexes of the lines the sponsor removed.
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  // What the sponsor already has active (cart item key → stores), checked once per plan.
  const [active, setActive] = useState<{ plan: SponsorPlan; map: ActiveActivations } | null>(null);
  // What the last price check found per line (line index → text).
  const [problems, setProblems] = useState<ReadonlyMap<number, string>>(new Map());
  // The plan was bought: its summary replaces the plan.
  const [done, setDone] = useState<ActivatedDone | null>(null);

  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorSearchFilters>("GET", routes.api.sponsorFilters).then((r) => {
      if (cancelled) return;
      setFiltersFailed(!r.view);
      if (r.view) setFilters(r.view);
      else toast.error(r.message ?? "Couldn't load the planner's options.");
    });
    return () => {
      cancelled = true;
    };
  }, [filterLoads]);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    activeActivations().then((map) => {
      // If it can't be checked, buying isn't blocked (as in the cart).
      if (!cancelled) setActive({ plan, map: map ?? new Map() });
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  // One plan per press (the API allows 20 an hour, failed ones included), never retried by itself.
  async function build(request: SponsorPlanRequest): Promise<FieldErrors | null> {
    setBuilding(true);
    setProblem(null);
    const r = await sponsorRequest<SponsorPlan>("POST", routes.api.sponsorPlanRecommend, { body: request });
    setBuilding(false);
    if (r.view) {
      setPlan(r.view);
      setExcluded(new Set());
      setMarket(ALL_MARKETS);
      setProblems(new Map());
      setDone(null);
      return null;
    }
    const fieldErrors: FieldErrors = {};
    for (const e of r.errors ?? []) {
      const field = fieldOfPath(e.path);
      if (field && !fieldErrors[field]) fieldErrors[field] = e.message;
    }
    if (Object.keys(fieldErrors).length) return fieldErrors;
    setProblem(r.message ?? "Couldn't build a plan. Please try again.");
    return null;
  }

  function remove(index: number) {
    setExcluded((prev) => new Set(prev).add(index));
  }

  // Back to an empty planner after a purchase; the composer keeps what was typed.
  function startOver() {
    setDone(null);
    setPlan(null);
    setProblems(new Map());
  }

  const summary = plan ? summarizePlan(plan, excluded) : null;

  // The cart items of the lines still in the plan (every market, not only the one shown).
  const entries = plan
    ? planEntries(
        plan.lines.map((line, index) => ({ line, index })).filter(({ index }) => !excluded.has(index)),
        plan.currency
      )
    : [];
  const activeMap = active && active.plan === plan ? active.map : null;
  // Lines with something the sponsor already has active: without stores it isn't bought twice.
  const activeLines = new Set(
    entries.filter((e) => activeMap?.has(cartItemKey(e.cartLine.item))).map((e) => e.lineIndex)
  );
  const notes = new Map(problems);
  for (const index of activeLines) {
    const owned = "You already have this active.";
    notes.set(index, problems.has(index) ? `${owned} ${problems.get(index)}` : owned);
  }

  return (
    // Spacing and title sizes follow the admin pages, as on Fundable Needs.
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-col">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            CAMPAIGN PLANNER
          </h2>
          <p className="text-base leading-[26px] text-[#e5e5e5]">
            Describe the campaign you want, or set it up yourself. Dime AI searches the organizations, packages and
            add-ons near your locations and builds one plan within your budget.
          </p>
        </div>
        <span className="text-[13px] font-bold tracking-[1px] px-3 py-2 rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
          {tier} BRANDS ONLY
        </span>
      </div>

      <PlanComposer
        filters={filters}
        filtersFailed={filtersFailed}
        onRetryFilters={() => setFilterLoads((n) => n + 1)}
        stores={stores}
        building={building}
        onBuild={build}
      />

      {building ? (
        <section aria-label="Building your plan" className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-center gap-3 text-center")}>
          <Loader />
          <p className="text-[15px] text-[#d4d4d4]">Dime AI is building your plan. This can take a minute or two.</p>
        </section>
      ) : (
        problem && (
          <section role="alert" className={cn(CARD, "rounded-[8px] p-5 flex flex-col gap-1")}>
            <p className="text-[15px] font-semibold text-[#f0c36a]">Couldn’t build a plan</p>
            <p className="text-sm text-[#d4d4d4]">{problem}</p>
          </section>
        )
      )}

      {!building && !plan && !problem && (
        <section aria-label="Your plan" className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-2")}>
          <p className="text-[15px] text-white font-semibold">Your plan will appear here.</p>
          <p className="text-sm text-[#a8a8a8]">
            Describe your campaign or set your locations and budget above, then press Build my plan. Nothing is
            bought until you choose to.
          </p>
        </section>
      )}

      {!building && done && (
        <ActivatedSummary
          done={done}
          actions={
            <>
              <Link href={routes.ui.sponsor.mySponsorships} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
                View my sponsorships
              </Link>
              <Button
                label="Build another plan"
                onClick={startOver}
                className={cn(OUTLINE_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px] font-semibold")}
              />
            </>
          }
        />
      )}

      {!building && !done && plan && summary && (
        <section aria-label="Recommended package" className="flex flex-col gap-6">
          <div className="flex gap-[14px] items-start">
            <span className="size-11 shrink-0 rounded-[12px] bg-[#2a2148] border border-[#4a3f7a] flex items-center justify-center">
              <Sparkles className="size-[22px] text-[#d9ccff]" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold tracking-[1px] text-[#c4c4c4]">DIME AI · FINAL PACKAGE</div>
              <h3 className="mt-1 font-display font-extrabold text-[28px] sm:text-[36px] lg:text-[44px] uppercase leading-none break-words">
                {plan.title}
              </h3>
              <p className="mt-[10px] text-base text-[#d4d4d4] leading-[1.55] max-w-[860px]">{plan.summary}</p>
              {plan.skippedMarketCount > 0 && (
                <p className={cn(HINT, "mt-2")}>
                  {`The planner covers up to 10 of your markets; ${
                    plan.skippedMarketCount === 1 ? "1 more market wasn’t" : `${plan.skippedMarketCount} more markets weren’t`
                  } searched.`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {planStats(summary).map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <MarketBreakdown markets={summary.markets} />

          <PlacementsTable
            lines={plan.lines}
            markets={plan.markets}
            market={market}
            onMarketChange={setMarket}
            excluded={excluded}
            onRemove={remove}
            onRestore={() => setExcluded(new Set())}
            notes={notes}
          />

          <div className="flex flex-wrap gap-5">
            <InventoryMix mix={summary.inventoryMix} count={summary.lineCount} />
            <LaunchPanel
              entries={entries}
              count={summary.lineCount}
              totalCents={summary.totalCents}
              checking={!activeMap}
              blockedReason={
                activeLines.size
                  ? `Remove the ${plural(activeLines.size, "line")} you already have active (✕) to buy the plan.`
                  : null
              }
              onProblems={setProblems}
              onBought={setDone}
            />
          </div>
        </section>
      )}
    </div>
  );
}
