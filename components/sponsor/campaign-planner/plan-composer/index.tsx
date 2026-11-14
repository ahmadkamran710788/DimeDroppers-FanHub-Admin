"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { parseMoney, typedMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import MultiSelect, { ALL } from "@/components/common/multi-select";
import Select from "@/components/common/select";
import { FIELD, HINT, HINT_LINK, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import type { SponsorStore } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import { MAX_PICKED_STORES } from "@/components/sponsor/find-organizations/data";
import { campaignRequestSchema } from "@/components/sponsor/campaign-planner/schema";
import { DEFAULT_FORM, GOAL_OPTIONS, type PlanForm } from "@/components/sponsor/campaign-planner/data";
import type { FilterOption, SponsorSearchFilters } from "@/utils/types/sponsor-packages";
import type { PlanGoal, SponsorPlanRequest } from "@/utils/types/sponsor-plan";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

const chipOptions = (options: FilterOption[] | undefined) => (options ?? []).map((o) => ({ label: o.label, value: o.code }));

export type FieldErrors = Partial<Record<keyof PlanForm, string>>;

interface PlanComposerProps {
  // Radius options, seasons, sports and genders from GET /filters; null while they load (or failed).
  filters: SponsorSearchFilters | null;
  filtersFailed: boolean;
  onRetryFilters: () => void;
  // The brand's locations with a map point; null while they load.
  stores: SponsorStore[] | null;
  building: boolean;
  // Asks for the plan; resolves the API's messages for fields (shown under them), or null.
  onBuild: (request: SponsorPlanRequest) => Promise<FieldErrors | null>;
}

// What the sponsor plans: around which locations, the budget, season and goal, and which sports and genders.
// Dime AI picks the organizations itself; for a tournament, the events it plans are its events near these
// locations.
export default function PlanComposer({ filters, filtersFailed, onRetryFilters, stores, building, onBuild }: PlanComposerProps) {
  const [form, setForm] = useState<PlanForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Until the sponsor picks one, the season follows the filters' first season.
  const season = form.season || filters?.seasons[0]?.code || "";
  const noStores = !!stores && stores.length === 0;

  function update<K extends keyof PlanForm>(field: K, value: PlanForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function build(e: React.FormEvent) {
    e.preventDefault();
    if (building || noStores) return;
    if (!(await validateAndSetErrors(campaignRequestSchema, form, setErrors))) return;
    const request: SponsorPlanRequest = {
      brandLocationIds: form.stores === ALL ? "ALL" : form.stores,
      radiusMiles: Number(form.radius),
      budgetCents: Math.round(parseMoney(form.budget) * 100),
      ...(season && { season }),
      goal: form.goal,
      ...(form.sports.length && { sports: form.sports }),
      ...(form.genders.length && { genders: form.genders }),
    };
    const problems = await onBuild(request);
    if (problems) setErrors(problems);
  }

  return (
    <form
      aria-label="Plan your campaign"
      noValidate
      onSubmit={build}
      className="bg-[#141414] border border-[#2c2547] rounded-[8px] p-6 flex flex-col gap-[18px]"
    >
      {filtersFailed && (
        <p className="text-sm text-[#f0c36a]">
          Couldn’t load the season, sport and gender options.{" "}
          <Button variant="text" size="sm" label="Try again" onClick={onRetryFilters} className="inline text-sm text-[#c9b8ff] underline" />
        </p>
      )}

      {/* Where: the brand's locations and one radius around each (the API takes one). */}
      <div className="flex flex-col gap-2">
        <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
          <MultiSelect
            label="BRAND LOCATIONS"
            name="plan-locations"
            value={form.stores}
            onChange={(picked) => update("stores", picked)}
            options={(stores ?? []).map((s) => ({ label: s.label, value: s.id, hint: s.hint }))}
            allLabel={`All my locations (${stores?.length ?? 0})`}
            max={MAX_PICKED_STORES}
            countLabel={(count) => `${count} locations`}
            placeholder={!stores ? "Loading your locations…" : stores.length ? "Choose locations" : "No locations yet"}
            searchPlaceholder="Search your locations"
            disabled={!stores?.length}
            error={errors.stores}
            variant="dark"
            className="min-w-0 @min-[416px]:col-span-2"
            labelClassName={SECTION_LABEL}
            selectClassName={cn(CONTROL, "px-3")}
          />
          {/* Whole miles, digits only (checked against the API's 1–250 when building). */}
          <Input
            label="RADIUS (MILES)"
            name="plan-radius"
            value={form.radius}
            onChange={(e) => update("radius", e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="25"
            inputMode="numeric"
            error={errors.radius}
            className="min-w-0"
            labelClassName={SECTION_LABEL}
            inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
          />
        </div>
        {noStores && (
          <p className={HINT}>
            The planner works around your stores. Add a store location with its address on your{" "}
            <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
              Sponsor Profile
            </Link>{" "}
            first.
          </p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
        {/* Dollars, the number only; the "$" is fixed in the field. */}
        <Input
          label="TOTAL BUDGET"
          name="plan-budget"
          value={form.budget}
          onChange={(e) => {
            const amount = typedMoney(e.target.value);
            if (amount !== null) update("budget", amount);
          }}
          placeholder="60000"
          inputMode="decimal"
          icon={<span className="text-[16px] text-white/60">$</span>}
          error={errors.budget}
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          inputClassName={cn(CONTROL, "py-0 px-[14px] pl-9 placeholder:text-[#757575]")}
        />
        {/* The seasons still open (GET /filters); none left means any season. */}
        {(filters?.seasons.length ?? 0) > 0 && (
          <Select
            label="SEASON"
            name="plan-season"
            value={season}
            onChange={(e) => update("season", e.target.value)}
            options={chipOptions(filters?.seasons)}
            error={errors.season}
            variant="dark"
            className="min-w-0"
            labelClassName={SECTION_LABEL}
            selectClassName={cn(CONTROL, "px-3")}
          />
        )}
        <Select
          label="GOAL"
          name="plan-goal"
          value={form.goal}
          onChange={(e) => update("goal", e.target.value as PlanGoal)}
          options={GOAL_OPTIONS}
          error={errors.goal}
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex justify-between gap-3 flex-wrap">
          <div className={SECTION_LABEL}>SPORTS · SELECT ANY</div>
          <div className={HINT}>{form.sports.length ? `${form.sports.length} selected` : "All sports"}</div>
        </div>
        <FilterChips
          variant="pill"
          multiple
          ariaLabel="Sports"
          options={chipOptions(filters?.sports)}
          value={form.sports}
          onChange={(sports) => update("sports", sports)}
        />
        {errors.sports && <p className="text-sm text-error">{errors.sports}</p>}
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex justify-between gap-3 flex-wrap">
          <div className={SECTION_LABEL}>GENDER · SELECT ANY</div>
          <div className={HINT}>{form.genders.length ? `${form.genders.length} selected` : "All genders"}</div>
        </div>
        <FilterChips
          variant="pill"
          multiple
          ariaLabel="Gender"
          options={chipOptions(filters?.genders)}
          value={form.genders}
          onChange={(genders) => update("genders", genders)}
        />
        {errors.genders && <p className="text-sm text-error">{errors.genders}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262626] pt-[18px]">
        <p className={cn(HINT, "flex-[1_1_280px]")}>
          {building
            ? "Dime AI is building your plan. This can take a minute or two; please keep this page open."
            : "Dime AI picks organizations, packages and add-ons near your locations, within your budget."}
        </p>
        <Button
          type="submit"
          label={building ? "Building your plan…" : "Build my plan"}
          icon={<Sparkles className="size-[18px]" strokeWidth={2} />}
          disabled={building || noStores}
          className={cn(PRIMARY_BUTTON, "h-12 px-6 rounded-[10px] text-base")}
        />
      </div>
    </form>
  );
}
