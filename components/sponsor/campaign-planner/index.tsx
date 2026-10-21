"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { formatMoney, parseMoney } from "@/utils/helper";
import ConfirmModal from "@/components/common/confirm-modal";
import StatCard, { type Stat } from "@/components/common/stat-card";
import InventoryMix from "@/components/sponsor/campaign-planner/inventory-mix";
import LaunchPanel from "@/components/sponsor/campaign-planner/launch-panel";
import MarketBreakdown from "@/components/sponsor/campaign-planner/market-breakdown";
import PlacementsTable from "@/components/sponsor/campaign-planner/placements-table";
import PlanComposer from "@/components/sponsor/campaign-planner/plan-composer";
import { summarizePlan, type PlanSummary } from "@/components/sponsor/campaign-planner/summarize-plan";
import {
  DEFAULT_REQUEST,
  PLACEMENTS,
  PLAN,
  PLAN_STAT_TINTS,
  type MarketFilter,
} from "@/components/sponsor/campaign-planner/data";

// The four stat cards over the plan; the cost caption turns red when the plan is over budget.
function planStats(summary: PlanSummary, budget: number): Stat[] {
  const left = budget - summary.total;
  const marketCount = summary.markets.filter((m) => m.count > 0).length;
  return [
    {
      label: "Total cost",
      value: formatMoney(summary.total),
      tint: PLAN_STAT_TINTS.cost,
      ...(left >= 0
        ? { caption: `${formatMoney(left)} of ${formatMoney(budget)} left` }
        : { caption: `${formatMoney(-left)} over your ${formatMoney(budget)} budget`, trend: "down" as const }),
    },
    {
      label: "Organizations",
      value: String(summary.count),
      tint: PLAN_STAT_TINTS.organizations,
      caption: `across ${marketCount} ${marketCount === 1 ? "market" : "markets"}`,
    },
    {
      label: "Est. parent reach",
      value: summary.reach.toLocaleString("en-US"),
      tint: PLAN_STAT_TINTS.reach,
      caption: "from organizations’ follower data",
    },
    {
      label: "Cost per parent",
      value: formatMoney(summary.reach ? summary.total / summary.reach : 0),
      tint: PLAN_STAT_TINTS.costPerParent,
      caption: "per season",
    },
  ];
}

// Dime AI's Campaign Planner (national accounts): the sponsor describes a campaign and gets one
// package across organizations, which they can trim line by line and buy in one go.
export default function CampaignPlanner() {
  const [budget, setBudget] = useState(parseMoney(DEFAULT_REQUEST.budget));
  const [market, setMarket] = useState<MarketFilter>("All");
  // Lines the sponsor unticked.
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const summary = summarizePlan(PLACEMENTS, excluded);
  const shown = PLACEMENTS.filter((p) => market === "All" || p.market === market);

  function toggle(id: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
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
            Describe the campaign you want. Dime AI searches every organization, package and add-on and builds one plan
            within your budget.
          </p>
        </div>
        <span className="text-[13px] font-bold tracking-[1px] px-3 py-2 rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
          NATIONAL BRANDS ONLY
        </span>
      </div>

      <PlanComposer
        onBuild={(request) => {
          // Stands in for the Dime AI request: the mock plan comes back fresh against the new budget.
          setBudget(request.budget);
          setExcluded(new Set());
          setMarket("All");
          toast.success("Dime AI rebuilt your plan");
        }}
      />

      <section aria-label="Recommended package" className="flex flex-col gap-6">
        <div className="flex gap-[14px] items-start">
          <span className="size-11 shrink-0 rounded-[12px] bg-[#2a2148] border border-[#4a3f7a] flex items-center justify-center">
            <Sparkles className="size-[22px] text-[#d9ccff]" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-bold tracking-[1px] text-[#c4c4c4]">DIME AI · FINAL PACKAGE</div>
            <h3 className="mt-1 font-display font-extrabold text-[28px] sm:text-[36px] lg:text-[44px] uppercase leading-none">
              {PLAN.title}
            </h3>
            <p className="mt-[10px] text-base text-[#d4d4d4] leading-[1.55] max-w-[860px]">{PLAN.rationale}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {planStats(summary, budget).map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <MarketBreakdown markets={summary.markets} />

        <PlacementsTable
          placements={shown}
          market={market}
          onMarketChange={setMarket}
          excluded={excluded}
          onToggle={toggle}
        />

        <div className="flex flex-wrap gap-5">
          <InventoryMix mix={summary.mix} count={summary.count} />
          <LaunchPanel count={summary.count} total={summary.total} onBuy={() => setConfirmOpen(true)} />
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Buy full package"
        message={`Send package requests to ${summary.count} organizations for ${formatMoney(summary.total)}? Each organization confirms before you’re charged.`}
        confirmLabel="Send requests"
        busyLabel="Sending…"
        onConfirm={async () => {
          toast.success(`Package requests sent to ${summary.count} organizations`);
          return true;
        }}
      />
    </div>
  );
}
