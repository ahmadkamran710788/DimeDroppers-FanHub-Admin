"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { HINT, SECTION_LABEL } from "@/components/sponsor/styles";
import BriefTag from "@/components/sponsor/campaign-planner/brief-tag";
import { BRIEF_BORDER, MAX_SPLIT_ROWS, PLAN_CONTROL, type SplitRow } from "@/components/sponsor/campaign-planner/data";
import {
  newSplitRow,
  rowLabel,
  splitTotal,
  stateName,
  type SplitArea,
} from "@/components/sponsor/campaign-planner/split-rows";

const WHOLE_STATE = { label: "Whole state", value: "" };

interface SplitBudgetProps {
  rows: SplitRow[];
  onChange: (rows: SplitRow[]) => void;
  // The chosen stores' states and cities: what a row can be.
  areas: SplitArea[];
  // The brief filled the rows (POST /plans/prompt).
  fromBrief: boolean;
  error?: string;
  disabled?: boolean;
}

// The running total: done at 100%, otherwise what's left or over.
function totalText(total: number) {
  if (total === 100) return { text: "Total 100%", className: "text-success" };
  if (total < 100) return { text: `Total ${total}% · ${100 - total}% to go`, className: "text-[#f0c36a]" };
  return { text: `Total ${total}% · ${total - 100}% over`, className: "text-error" };
}

// The budget split by state or city (FANHUB_SPONSOR_PLAN_CHANGES_21_NOV_FRONTEND.md §3): each row is a state
// (or one of its cities) where the chosen stores are, and its percent of the budget; the rows add up to 100.
// No rows is no split (the budget is shared between the markets by their reach).
export default function SplitBudget({ rows, onChange, areas, fromBrief, error, disabled }: SplitBudgetProps) {
  const total = splitTotal(rows);
  const status = totalText(total);

  const change = (id: string, patch: Partial<SplitRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  // A row keeps its own choice listed even when the chosen stores no longer include it (the check names it).
  function stateOptions(row: SplitRow) {
    const options = areas.map((a) => ({ label: a.label, value: a.state }));
    return row.state && !areas.some((a) => a.state === row.state)
      ? [...options, { label: stateName(row.state), value: row.state }]
      : options;
  }

  function cityOptions(row: SplitRow) {
    const cities = areas.find((a) => a.state === row.state)?.cities ?? [];
    const options = [WHOLE_STATE, ...cities.map((city) => ({ label: city, value: city }))];
    return row.city && !cities.includes(row.city) ? [...options, { label: row.city, value: row.city }] : options;
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
          <div className={SECTION_LABEL}>SPLIT BUDGET · OPTIONAL</div>
          {fromBrief && <BriefTag />}
        </div>
        {rows.length > 0 && (
          <div aria-live="polite" className={cn("text-[13px] font-semibold", status.className)}>
            {status.text}
          </div>
        )}
      </div>
      <p className={HINT}>
        {rows.length
          ? "Each row gets its share of the budget. Stores outside these rows are left out, and what a row can’t spend stays unspent."
          : "Share the budget by state or city, e.g. 60% in one city and 40% in another. Without a split, it’s shared between your markets by their reach."}
      </p>

      {rows.map((row, index) => {
        // The column labels show on the first row only (every field keeps its label for screen readers).
        const labelClassName = cn(SECTION_LABEL, index > 0 && "sr-only");
        const brief = fromBrief && BRIEF_BORDER;
        return (
          <div
            key={row.id}
            className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_112px_48px] gap-3 items-end"
          >
            <Select
              label="STATE"
              name={`${row.id}-state`}
              value={row.state}
              // A city belongs to its state, so a new state starts as the whole state.
              onChange={(e) => change(row.id, { state: e.target.value, city: "" })}
              options={stateOptions(row)}
              placeholder="Choose a state"
              disabled={disabled}
              variant="dark"
              className="min-w-0"
              labelClassName={labelClassName}
              selectClassName={cn(PLAN_CONTROL, "px-3", brief)}
            />
            <Select
              label="CITY"
              name={`${row.id}-city`}
              value={row.city}
              onChange={(e) => change(row.id, { city: e.target.value })}
              options={cityOptions(row)}
              disabled={disabled || !row.state}
              variant="dark"
              className="min-w-0"
              labelClassName={labelClassName}
              selectClassName={cn(PLAN_CONTROL, "px-3", brief)}
            />
            <Input
              label="SHARE"
              name={`${row.id}-percent`}
              value={row.percent}
              onChange={(e) => change(row.id, { percent: e.target.value.replace(/\D/g, "").slice(0, 3) })}
              placeholder="50"
              inputMode="numeric"
              suffix={<span className="text-white/60">%</span>}
              disabled={disabled}
              className="min-w-0"
              labelClassName={labelClassName}
              inputClassName={cn(PLAN_CONTROL, "py-0 px-[14px] placeholder:text-[#757575]", brief)}
            />
            <Button
              size="icon"
              icon={<X className="size-4" strokeWidth={2} />}
              aria-label={`Remove ${row.state ? rowLabel(row) : "this row"} from the split`}
              title="Remove from the split"
              onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              className="size-12 rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#d4d4d4] hover:text-white hover:border-[#5a5a5a]"
            />
          </div>
        );
      })}

      {error && <p className="text-sm text-error">{error}</p>}

      <Button
        variant="text"
        size="sm"
        label={rows.length ? "Add a row" : "Split the budget"}
        icon={<Plus className="size-4" strokeWidth={2} />}
        onClick={() => onChange([...rows, newSplitRow(rows, areas)])}
        disabled={disabled || !areas.length || rows.length >= MAX_SPLIT_ROWS}
        className="self-start text-sm font-semibold text-[#c9b8ff] hover:text-white"
      />
    </div>
  );
}
