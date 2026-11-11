import type { SponsorPlan, SponsorPlanLine } from "@/utils/types/sponsor-plan";

export interface PlanMarketSummary {
  key: string;
  label: string;
  totalCents: number;
  organizationCount: number;
  fanReach: number;
  // Whole percent of the plan's spend.
  shareOfSpend: number;
}

export interface PlanSummary {
  totalCents: number;
  budgetCents: number;
  remainingCents: number;
  organizationCount: number;
  fanReach: number;
  costPerFanCents: number | null;
  // Lines still in the plan (the "N packages" and the inventory mix's "of N").
  lineCount: number;
  markets: PlanMarketSummary[];
  inventoryMix: { name: string; lineCount: number }[];
}

// The API's inventory mix keeps the top 8 slots.
const MIX_MAX = 8;

// Organisations and their fan reach, each organisation once (two event lines of a tournament share it).
function reachOf(lines: SponsorPlanLine[]) {
  const reach = new Map<string, number>();
  for (const line of lines) reach.set(line.organization.id, line.fanReach);
  return { organizationCount: reach.size, fanReach: [...reach.values()].reduce((sum, n) => sum + n, 0) };
}

const totalOf = (lines: SponsorPlanLine[]) => lines.reduce((sum, line) => sum + line.totalCents, 0);

// The plan's numbers for the lines still ticked (`excluded` holds the unticked lines' indexes). With every line
// in, they're the API's own; after an untick they're worked out again from the ticked lines, as the API does
// (FANHUB_SPONSOR_PLAN_FRONTEND.md §3). Markets stay listed at $0 when all their lines are unticked.
export function summarizePlan(plan: SponsorPlan, excluded: ReadonlySet<number>): PlanSummary {
  if (excluded.size === 0) {
    const { totals } = plan;
    return {
      totalCents: totals.totalCents,
      budgetCents: totals.budgetCents,
      remainingCents: totals.remainingCents,
      organizationCount: totals.organizationCount,
      fanReach: totals.fanReach,
      costPerFanCents: totals.costPerFanCents,
      lineCount: plan.lines.length,
      markets: plan.markets.map(({ key, label, totalCents, organizationCount, fanReach, shareOfSpend }) => ({
        key,
        label,
        totalCents,
        organizationCount,
        fanReach,
        shareOfSpend,
      })),
      inventoryMix: plan.inventoryMix,
    };
  }

  const included = plan.lines.filter((_, i) => !excluded.has(i));
  const totalCents = totalOf(included);
  const { organizationCount, fanReach } = reachOf(included);

  const markets = plan.markets.map(({ key, label }) => {
    const lines = included.filter((line) => line.market.key === key);
    const marketCents = totalOf(lines);
    return {
      key,
      label,
      totalCents: marketCents,
      ...reachOf(lines),
      shareOfSpend: totalCents ? Math.round((marketCents / totalCents) * 100) : 0,
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
    budgetCents: plan.totals.budgetCents,
    remainingCents: Math.max(0, plan.totals.budgetCents - totalCents),
    organizationCount,
    fanReach,
    costPerFanCents: fanReach ? Math.round(totalCents / fanReach) : null,
    lineCount: included.length,
    markets,
    inventoryMix,
  };
}
