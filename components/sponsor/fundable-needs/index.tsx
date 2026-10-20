"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import StatCard from "@/components/common/stat-card";
import NeedCard from "@/components/sponsor/fundable-needs/need-card";
import FundPanel from "@/components/sponsor/fundable-needs/fund-panel";
import {
  AREA_OPTIONS,
  CATEGORIES,
  NEEDS,
  SORT_OPTIONS,
  STATS,
  type Category,
} from "@/components/sponsor/fundable-needs/data";

// Picking a need starts the panel on the $500 preset.
const DEFAULT_AMOUNT_INDEX = 1;


// Sponsor landing page: open asks from nearby organizations, and a panel to fund the selected one.
export default function FundableNeeds() {
  const [category, setCategory] = useState<Category>("All");
  const [selectedId, setSelectedId] = useState(NEEDS[0].id);
  const [amountIndex, setAmountIndex] = useState(DEFAULT_AMOUNT_INDEX);
  const [area, setArea] = useState(AREA_OPTIONS[0].value);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);

  const shown = NEEDS.filter((n) => category === "All" || n.category === category.toUpperCase());
  // The panel keeps the selected need even when the filter hides its card.
  const selected = NEEDS.find((n) => n.id === selectedId) ?? NEEDS[0];

  function selectNeed(id: number) {
    setSelectedId(id);
    setAmountIndex(DEFAULT_AMOUNT_INDEX);
  }

  return (
    // Spacing and title sizes follow the admin pages (gap-10, 56px title, 16px subtitle).
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          FUNDABLE NEEDS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Real asks from organizations near you. Fund one fully or chip in, and choose how your brand is recognized.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-[10px]">
          {CATEGORIES.map((c) => {
            const on = category === c;
            return (
              <Button
                key={c}
                label={c}
                onClick={() => setCategory(c)}
                aria-pressed={on}
                className={cn(
                  "h-11 min-w-0 px-4 rounded-full text-[15px] font-semibold border backdrop-blur-none transition-none",
                  on ? "bg-[#2a2148] text-white border-[#8b6dff]" : "bg-[#0b0b0b] text-[#cfcfcf] border-[#333]"
                )}
              />
            );
          })}
        </div>
        <div className="flex gap-3 flex-wrap">
          <FilterChipMenu
            label={`Area: ${area}`}
            ariaLabel="Area"
            items={AREA_OPTIONS.map((o) => ({ label: o.label, onSelect: () => setArea(o.value) }))}
          />
          <FilterChipMenu
            label={`Sort: ${sort}`}
            ariaLabel="Sort"
            items={SORT_OPTIONS.map((o) => ({ label: o.label, onSelect: () => setSort(o.value) }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section
          aria-label="Needs"
          className="flex-[1_1_520px] min-w-0 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]"
        >
          {shown.map((need) => (
            <NeedCard key={need.id} need={need} selected={need.id === selectedId} onSelect={() => selectNeed(need.id)} />
          ))}
        </section>
        <FundPanel need={selected} amountIndex={amountIndex} onAmountChange={setAmountIndex} />
      </div>
    </div>
  );
}
