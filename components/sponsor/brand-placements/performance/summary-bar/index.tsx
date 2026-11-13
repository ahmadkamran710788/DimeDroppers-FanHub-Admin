"use client";

import { cn } from "@/utils/cn";
import Select from "@/components/common/select";
import { CARD, FIELD } from "@/components/sponsor/styles";
import { RANGE_OPTIONS, RANGES, type PerformanceRange } from "@/components/sponsor/brand-placements/data";

interface SummaryBarProps {
  summary: { lead: string; fans: string; rest: string };
  range: PerformanceRange;
  onRangeChange: (range: PerformanceRange) => void;
}

// The period in one sentence, with the date range it covers.
export default function SummaryBar({ summary, range, onRangeChange }: SummaryBarProps) {
  return (
    <div className={cn(CARD, "rounded-[14px] px-[22px] py-5 flex flex-wrap items-center justify-between gap-4")}>
      <p className="max-w-[760px] text-lg leading-normal">
        {summary.lead} <strong className="font-semibold text-[#c7d2fe]">{summary.fans}</strong> {summary.rest}
      </p>
      <Select
        label="Date range"
        name="performance-range"
        value={range}
        options={RANGE_OPTIONS}
        onChange={(e) => {
          const next = RANGES.find((r) => r === e.target.value);
          if (next) onRangeChange(next);
        }}
        variant="dark"
        className="w-[200px] max-w-full"
        labelClassName="sr-only"
        selectClassName={cn(FIELD, "h-11 px-[14px] text-[15px]")}
      />
    </div>
  );
}
