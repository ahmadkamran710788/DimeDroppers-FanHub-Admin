"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { CARD, FIELD, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { orgSearchSchema } from "@/components/sponsor/find-organizations/schema";
import {
  DEFAULT_SEARCH,
  IN_APP_OPTIONS,
  RADIUS_OPTIONS,
  SPORT_OPTIONS,
  VENUE_OPTIONS,
  type OrgSearch,
} from "@/components/sponsor/find-organizations/data";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

interface SearchFiltersProps {
  // Called with the validated filters when the sponsor presses Show organizations.
  onSearch: (search: OrgSearch) => void;
}

// Where the sponsor sets the area, sports and inventory to search. Changes apply on submit.
export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [form, setForm] = useState(DEFAULT_SEARCH);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof OrgSearch>(field: K, value: OrgSearch[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // Clears the sports and inventory picks; the area stays.
  function clear() {
    setForm((prev) => ({ ...prev, sports: [], inApp: [], venue: [] }));
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(orgSearchSchema, form, setErrors))) return;
    onSearch({ ...form, location: form.location.trim() });
  }

  return (
    <form
      aria-label="Filters"
      noValidate
      onSubmit={search}
      className={cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-6")}
    >
      {/* Location takes two of the 200px columns once there's room for two. */}
      <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
        <Input
          label="LOCATION"
          name="org-location"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="City or ZIP code"
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
          options={RADIUS_OPTIONS}
          error={errors.radius}
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
          options={SPORT_OPTIONS}
          value={form.sports}
          onChange={(sports) => update("sports", sports)}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5">
        <InsetSection title="IN-APP INVENTORY" description="Where your brand shows inside the organization’s Fan Hub">
          <FilterChips
            variant="pill"
            multiple
            ariaLabel="In-app inventory"
            options={IN_APP_OPTIONS}
            value={form.inApp}
            onChange={(inApp) => update("inApp", inApp)}
          />
        </InsetSection>
        <InsetSection title="VENUE INVENTORY" description="Physical space to let at fields, courts and gyms">
          <FilterChips
            variant="pill"
            multiple
            ariaLabel="Venue inventory"
            options={VENUE_OPTIONS}
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
          label="Show organizations"
          className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")}
        />
      </div>
    </form>
  );
}
