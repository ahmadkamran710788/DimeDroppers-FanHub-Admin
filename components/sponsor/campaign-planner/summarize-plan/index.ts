import { INVENTORY, MARKETS, type Inventory, type Market, type Placement } from "@/components/sponsor/campaign-planner/data";

export interface MarketSummary {
  name: Market;
  cost: number;
  reach: number;
  count: number;
  // Percent of the plan's cost spent in this market.
  share: number;
}

export interface InventorySummary {
  name: Inventory;
  // Packages in the plan that include it.
  count: number;
}

export interface PlanSummary {
  total: number;
  reach: number;
  count: number;
  markets: MarketSummary[];
  mix: InventorySummary[];
}

const sumOf = (lines: Placement[], key: "cost" | "reach") => lines.reduce((sum, line) => sum + line[key], 0);

// Totals for the lines still in the plan; `excluded` holds the ids the sponsor unticked.
export function summarizePlan(placements: Placement[], excluded: ReadonlySet<number>): PlanSummary {
  const included = placements.filter((p) => !excluded.has(p.id));
  const total = sumOf(included, "cost");
  const markets = MARKETS.map((name) => {
    const lines = included.filter((p) => p.market === name);
    const cost = sumOf(lines, "cost");
    return { name, cost, reach: sumOf(lines, "reach"), count: lines.length, share: total ? Math.round((cost / total) * 100) : 0 };
  });
  const mix = INVENTORY.map((name) => ({ name, count: included.filter((p) => p.inventory.includes(name)).length }));
  return { total, reach: sumOf(included, "reach"), count: included.length, markets, mix };
}
