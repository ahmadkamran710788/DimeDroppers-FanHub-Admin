import type { SponsorPlan, SponsorPlanLine } from "@/utils/types/sponsor-plan";

export interface PlanMarketSummary {
  key: string;
  label: string;
  totalCents: number;
  organizationCount: number;
  // People reached by the market's lines.
  projectedReach: number;
  // Whole percent of the plan's spend.
  shareOfSpend: number;
  // What's spent here as a percent of the budget, to one decimal (58.5).
  shareOfBudget: number;
  // The budget split row's percent; null without a split.
  requestedPercent: number | null;
  // The market's share of the budget in cents (the split row's, or the reach-based one).
  targetCents: number;
}

export interface PlanSummary {
  totalCents: number;
  budgetCents: number;
  remainingCents: number;
  organizationCount: number;
  // People reached (students or rostered players, with their parents).
  projectedReach: number;
  // Null when the reach is 0.
  costPerReachCents: number | null;
  // The most one organization may cost.
  lineCapCents: number;
  // Lines still in the plan (the "N packages" and the inventory mix's "of N").
  lineCount: number;
  markets: PlanMarketSummary[];
  inventoryMix: { name: string; lineCount: number }[];
}

// The API's inventory mix keeps the top 8 slots.
const MIX_MAX = 8;

// Organisations (each once: two event lines of a tournament are one organisation) and the lines' reach added up,
// as the API adds it (each event line reaches its own teams).
function reachOf(lines: SponsorPlanLine[]) {
  return {
    organizationCount: new Set(lines.map((line) => line.organization.id)).size,
    projectedReach: lines.reduce((sum, line) => sum + line.projectedReach, 0),
  };
}

const totalOf = (lines: SponsorPlanLine[]) => lines.reduce((sum, line) => sum + line.totalCents, 0);

// The plan's numbers for the lines still in it (`excluded` holds the removed lines' indexes). With every line
// in, they're the API's own; after a removal they're worked out again from the remaining lines, as the API does
// (FANHUB_SPONSOR_PLAN_FRONTEND.md §3, FANHUB_SPONSOR_PLAN_CHANGES_21_NOV_FRONTEND.md §2). Markets stay listed
// at $0 when all their lines are removed, with their split percent and target.
export function summarizePlan(plan: SponsorPlan, excluded: ReadonlySet<number>): PlanSummary {
  const { totals } = plan;
  if (excluded.size === 0) {
    return {
      totalCents: totals.totalCents,
      budgetCents: totals.budgetCents,
      remainingCents: totals.remainingCents,
      organizationCount: totals.organizationCount,
      projectedReach: totals.projectedReach,
      costPerReachCents: totals.costPerReachCents,
      lineCapCents: totals.lineCapCents,
      lineCount: plan.lines.length,
      markets: plan.markets.map((m) => ({
        key: m.key,
        label: m.label,
        totalCents: m.totalCents,
        organizationCount: m.organizationCount,
        projectedReach: m.projectedReach,
        shareOfSpend: m.shareOfSpend,
        shareOfBudget: m.shareOfBudget,
        requestedPercent: m.requestedPercent,
        targetCents: m.targetCents,
      })),
      inventoryMix: plan.inventoryMix,
    };
  }

  const included = plan.lines.filter((_, i) => !excluded.has(i));
  const totalCents = totalOf(included);
  const { organizationCount, projectedReach } = reachOf(included);

  const markets = plan.markets.map(({ key, label, requestedPercent, targetCents }) => {
    const lines = included.filter((line) => line.market.key === key);
    const marketCents = totalOf(lines);
    return {
      key,
      label,
      totalCents: marketCents,
      ...reachOf(lines),
      shareOfSpend: totalCents ? Math.round((marketCents / totalCents) * 100) : 0,
      shareOfBudget: totals.budgetCents ? Math.round((marketCents / totals.budgetCents) * 1000) / 10 : 0,
      requestedPercent,
      targetCents,
    };
  });

  const slots = new Map<string, number>();
  for (const line of included) for (const name of line.inAppInventory) slots.set(name, (slots.get(name) ?? 0) + 1);
  const inventoryMix = [...slots.entries()]
    .map(([name, lineCount]) => ({ name, lineCount }))
    .sort((a, b) => b.lineCount - a.lineCount || a.name.localeCompare(b.name))
    .slice(0, MIX_MAX);

  return {
    totalCents,
    budgetCents: totals.budgetCents,
    remainingCents: Math.max(0, totals.budgetCents - totalCents),
    organizationCount,
    projectedReach,
    costPerReachCents: projectedReach ? Math.round(totalCents / projectedReach) : null,
    lineCapCents: totals.lineCapCents,
    lineCount: included.length,
    markets,
    inventoryMix,
  };
}
