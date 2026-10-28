"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { GOAL_OPTIONS, SEASON_OPTIONS } from "@/components/sponsor/data";
import { CARD, FIELD, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { orgSearchSchema } from "@/components/sponsor/find-organizations/schema";
import { DEFAULT_SEARCH, type OrgSearch } from "@/components/sponsor/find-organizations/data";
import type { FilterOption, SponsorSearchFilters } from "@/utils/types/sponsor-packages";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

interface SearchFiltersProps {
  // The chips and radius options from GET /filters; null while they load.
  filters: SponsorSearchFilters | null;
  // Called with the validated filters when the sponsor presses Show organizations.
  onSearch: (search: OrgSearch) => void;
  // A search is running: the button waits.
  searching?: boolean;
}

const chipOptions = (options: FilterOption[] | undefined) => (options ?? []).map((o) => ({ label: o.label, value: o.code }));

// Where the sponsor sets the area, sports and inventory to search. Changes apply on submit.
export default function SearchFilters({ filters, onSearch, searching = false }: SearchFiltersProps) {
  const [form, setForm] = useState(DEFAULT_SEARCH);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof OrgSearch>(field: K, value: OrgSearch[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // Clears the name, type, budget, season, goal, sports, genders and inventory picks; the area stays.
  function clear() {
    const next = {
      ...form,
      name: "",
      type: "",
      budget: "",
      season: "",
      goal: "",
      sports: [],
      genders: [],
      inApp: [],
      venue: [],
    };
    setForm(next);
    setErrors({});
    // The results follow straight away, so they never show filters that are no longer set.
    onSearch({ ...next, location: next.location.trim() });
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(orgSearchSchema, form, setErrors))) return;
    onSearch({ ...form, name: form.name.trim(), location: form.location.trim(), budget: form.budget.trim() });
  }

  return (
    <form
      aria-label="Filters"
      noValidate
      onSubmit={search}
      className={cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-6")}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4 items-start">
        <Input
          label="ORGANIZATION NAME"
          name="org-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Search by name"
          error={errors.name}
          maxLength={120}
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
        />
        <div className="flex flex-col gap-[10px] min-w-0">
          <div className={SECTION_LABEL}>ORGANIZATION TYPE</div>
          <FilterChips
            variant="pill"
            ariaLabel="Organization type"
            options={[{ label: "All", value: "" }, ...chipOptions(filters?.organizationTypes)]}
            value={form.type}
            onChange={(type) => update("type", type)}
          />
        </div>
      </div>

      {/* Location takes two of the 200px columns once there's room for two. */}
      <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
        <Input
          label="LOCATION"
          name="org-location"
          value={form.location}
          onChange={(e) => {
            update("location", e.target.value);
            // The radius only applies with a location, so emptying it puts the radius back to unpicked.
            if (!e.target.value.trim()) update("radius", "");
          }}
          placeholder="City, ZIP code or state"
          error={errors.location}
          className="min-w-0 @min-[416px]:col-span-2"
          labelClassName={SECTION_LABEL}
          inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
        />
        <Select
          label="RADIUS"
          name="org-radius"
          value={form.radius}
          onChange={(e) => update("radius", e.target.value)}
          options={(filters?.radiusOptions ?? [10, 25, 50, 100]).map((miles) => ({ label: `${miles} miles`, value: String(miles) }))}
          placeholder="Select radius"
          disabled={!form.location.trim()}
          error={errors.radius}
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
      </div>

      {/* As on the Campaign Planner. Not sent to the API yet. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
        <Input
          label="TOTAL BUDGET"
          name="org-budget"
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
          placeholder="e.g. $60,000"
          error={errors.budget}
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
        />
        <Select
          label="SEASON"
          name="org-season"
          value={form.season}
          onChange={(e) => update("season", e.target.value)}
          options={SEASON_OPTIONS}
          placeholder="Any season"
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
        <Select
          label="GOAL"
          name="org-goal"
          value={form.goal}
          onChange={(e) => update("goal", e.target.value)}
          options={GOAL_OPTIONS}
          placeholder="Any goal"
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex justify-between gap-3 flex-wrap">
          <div className={SECTION_LABEL}>SPORTS · SELECT ANY</div>
          <div className="text-[13px] text-[#a8a8a8]">{`${form.sports.length} selected`}</div>
        </div>
        <FilterChips
          variant="pill"
          multiple
          ariaLabel="Sports"
          options={chipOptions(filters?.sports)}
          value={form.sports}
          onChange={(sports) => update("sports", sports)}
        />
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex justify-between gap-3 flex-wrap">
          <div className={SECTION_LABEL}>GENDER · SELECT ANY</div>
          <div className="text-[13px] text-[#a8a8a8]">{`${form.genders.length} selected`}</div>
        </div>
        <FilterChips
          variant="pill"
          multiple
          ariaLabel="Gender"
          options={chipOptions(filters?.genders)}
          value={form.genders}
          onChange={(genders) => update("genders", genders)}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5">
        <InsetSection title="IN-APP INVENTORY" description="Where your brand shows inside the organization’s Fan Hub">
          <FilterChips
            variant="pill"
            multiple
            ariaLabel="In-app inventory"
            options={chipOptions(filters?.inApp)}
            value={form.inApp}
            onChange={(inApp) => update("inApp", inApp)}
          />
        </InsetSection>
        <InsetSection title="VENUE INVENTORY" description="Physical space to let at fields, courts and gyms">
          <FilterChips
            variant="pill"
            multiple
            ariaLabel="Venue inventory"
            options={chipOptions(filters?.venue)}
            value={form.venue}
            onChange={(venue) => update("venue", venue)}
          />
        </InsetSection>
      </div>

      <div className="flex justify-end gap-3 flex-wrap">
        <Button
          label="Clear filters"
          onClick={clear}
          className={cn(OUTLINE_BUTTON, "h-12 px-[18px] rounded-[10px] text-[15px] font-semibold")}
        />
        <Button
          type="submit"
          label={searching ? "Searching…" : "Show organizations"}
          disabled={searching}
          className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")}
        />
      </div>
    </form>
  );
}
