"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Select from "@/components/common/select";
import StatTile from "@/components/sponsor/stat-tile";
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

const FILTER_LABEL = "text-[15px] font-normal text-[#c4c4c4]";
const FILTER_SELECT = "w-auto h-11 rounded-[10px] text-[15px] font-normal leading-[normal] px-[10px] bg-[#0b0b0b] text-white border-[#333]";

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
    <div className="pt-12 px-4 lg:px-14 pb-16 flex flex-col gap-8 max-w-[1240px] w-full">
      <div>
        <h1 className="font-bebas font-normal text-[76px] leading-[0.95] tracking-[0.5px]">FUNDABLE NEEDS</h1>
        <p className="mt-[14px] text-[19px] text-[#e5e5e5]">
          Real asks from organizations near you. Fund one fully or chip in, and choose how your brand is recognized.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
        {STATS.map((stat) => (
          <StatTile key={stat.label} {...stat} />
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
          <Select
            label="Area"
            name="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            options={AREA_OPTIONS}
            nativeArrow
            className="flex-row items-center gap-[10px]"
            labelClassName={FILTER_LABEL}
            selectClassName={FILTER_SELECT}
          />
          <Select
            label="Sort"
            name="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={SORT_OPTIONS}
            nativeArrow
            className="flex-row items-center gap-[10px]"
            labelClassName={FILTER_LABEL}
            selectClassName={FILTER_SELECT}
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
