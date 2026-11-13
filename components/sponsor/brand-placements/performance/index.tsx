"use client";

import BarChart from "@/components/sponsor/brand-placements/performance/bar-chart";
import Glossary from "@/components/sponsor/brand-placements/performance/glossary";
import Highlights from "@/components/sponsor/brand-placements/performance/highlights";
import InventoryPerformance from "@/components/sponsor/brand-placements/performance/inventory-performance";
import KpiCards from "@/components/sponsor/brand-placements/performance/kpi-cards";
import SummaryBar from "@/components/sponsor/brand-placements/performance/summary-bar";
import { usePerformance } from "@/components/sponsor/brand-placements/performance/use-performance";

interface PerformanceProps {
  // "Change this slot's setup": back to the Set up placements tab.
  onEditSetup: () => void;
}

// The Performance tab: how the sponsor's slots did in the picked range (sample numbers until the
// performance API exists).
export default function Performance({ onEditSetup }: PerformanceProps) {
  const perf = usePerformance();

  return (
    <div className="flex flex-col gap-6">
      <SummaryBar summary={perf.summary} range={perf.range} onRangeChange={perf.setRange} />
      <KpiCards kpis={perf.kpis} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-[14px]">
        {perf.barCharts.map((c) => (
          <BarChart key={c.title} title={c.title} sub={c.sub} bars={c.bars} />
        ))}
      </div>
      <Highlights highlights={perf.highlights} />
      <InventoryPerformance perf={perf} onEditSetup={onEditSetup} />
      <Glossary />
    </div>
  );
}
