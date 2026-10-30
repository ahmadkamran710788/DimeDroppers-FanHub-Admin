"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import MultiSelect, { ALL, type MultiSelectValue } from "@/components/common/multi-select";
import Select from "@/components/common/select";
import { CARD, FIELD, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { orgSearchSchema } from "@/components/sponsor/find-organizations/schema";
import type { SponsorStore } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import {
  DEFAULT_SEARCH,
  MAX_PICKED_STORES,
  searchesNearStores,
  type OrgSearch,
} from "@/components/sponsor/find-organizations/data";
import type { FilterOption, SponsorSearchFilters } from "@/utils/types/sponsor-packages";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

// The form as typed: the stores stay null until the sponsor picks some, so they follow the default (All my
// locations) once the stores have loaded.
interface FilterForm extends Omit<OrgSearch, "stores"> {
  stores: MultiSelectValue | null;
}

interface SearchFiltersProps {
  // The chips and radius options from GET /filters; null while they load.
  filters: SponsorSearchFilters | null;
  // The brand's stores that can be searched near; null while they load.
  stores: SponsorStore[] | null;
  // Called with the validated filters when the sponsor presses Show organizations.
  onSearch: (search: OrgSearch) => void;
  // A search is running: the button waits.
  searching?: boolean;
}

const chipOptions = (options: FilterOption[] | undefined) => (options ?? []).map((o) => ({ label: o.label, value: o.code }));

// Where the sponsor sets the stores to search near, the sports and the inventory. Changes apply on submit.
// It shows straight away; only the Locations list waits for the stores.
export default function SearchFilters({ filters, stores, onSearch, searching = false }: SearchFiltersProps) {
  const [form, setForm] = useState<FilterForm>({ ...DEFAULT_SEARCH, stores: null });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Untouched, the area is all the stores at the default radius (anywhere without stores).
  const current: OrgSearch = {
    ...form,
    stores: form.stores ?? (stores?.length ? ALL : []),
    radius: form.radius || (filters ? String(filters.radiusDefaultMiles) : ""),
  };

  function update<K extends keyof FilterForm>(field: K, value: FilterForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // Clears the name, type, budget, season, sports, genders, in-app and physical asset category picks; the area
  // stays.
  function clear() {
    const next = {
      ...form,
      name: "",
      type: "",
      budget: "",
      season: "",
      sports: [],
      genders: [],
      inApp: [],
      assetCategories: [],
    };
    setForm(next);
    setErrors({});
    // The results follow straight away, so they never show filters that are no longer set.
    onSearch({ ...current, ...next, stores: current.stores, radius: current.radius });
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(orgSearchSchema, current, setErrors))) return;
    onSearch({ ...current, name: current.name.trim(), budget: current.budget.trim() });
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

      {/* Locations takes two of the 200px columns once there's room for two. One radius applies to every
          picked store (the API takes one). */}
      <div className="flex flex-col gap-2">
        <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
          <MultiSelect
            label="LOCATIONS"
            name="org-locations"
            value={current.stores}
            onChange={(picked) => update("stores", picked)}
            options={(stores ?? []).map((s) => ({ label: s.label, value: s.id, hint: s.hint }))}
            allLabel={`All my locations (${stores?.length ?? 0})`}
            max={MAX_PICKED_STORES}
            countLabel={(count) => `${count} locations`}
            placeholder={!stores ? "Loading your locations…" : stores.length ? "Anywhere" : "No locations yet"}
            searchPlaceholder="Search your locations"
            disabled={!stores?.length}
            variant="dark"
            className="min-w-0 @min-[416px]:col-span-2"
            labelClassName={SECTION_LABEL}
            selectClassName={cn(CONTROL, "px-3")}
          />
          <Select
            label="RADIUS"
            name="org-radius"
            value={current.radius}
            onChange={(e) => update("radius", e.target.value)}
            options={(filters?.radiusOptions ?? [10, 25, 50, 100]).map((miles) => ({ label: `${miles} miles`, value: String(miles) }))}
            placeholder="Select radius"
            disabled={!searchesNearStores(current)}
            error={errors.radius}
            variant="dark"
            className="min-w-0"
            labelClassName={SECTION_LABEL}
            selectClassName={cn(CONTROL, "px-3")}
          />
        </div>
        {stores && !stores.length && (
          <p className="text-[13px] text-[#a8a8a8]">
            Add your locations on your{" "}
            <Link href={routes.ui.sponsor.profile} className="text-[#c9b8ff] underline hover:text-white">
              Sponsor Profile
            </Link>{" "}
            to find organizations near them.
          </p>
        )}
      </div>

      {/* Only organizations with a package within the budget, and with games in the season. */}
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
          options={[{ label: "Any season", value: "" }, ...chipOptions(filters?.seasons)]}
          placeholder="Any season"
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
        {/* The organization's physical assets, by the category it gave them (the list from GET /filters). It keeps
            organizations with a sponsor-enabled asset in any picked category; tournaments are checked per event. */}
        <InsetSection title="PHYSICAL ASSET CATEGORY" description="Physical assets the organization offers, by type">
          <MultiSelect
            label="Physical asset category"
            name="org-asset-categories"
            value={form.assetCategories}
            onChange={(picked) => update("assetCategories", picked === ALL ? [] : picked)}
            options={chipOptions(filters?.physicalAssetCategories)}
            countLabel={(count) => `${count} categories`}
            placeholder={filters ? "Any category" : "Loading categories…"}
            searchPlaceholder="Search categories"
            disabled={!filters?.physicalAssetCategories?.length}
            variant="dark"
            labelClassName="sr-only"
            selectClassName={cn(CONTROL, "px-3")}
          />
        </InsetSection>
      </div>

      <div className="flex justify-end gap-3 flex-wrap">
        <Button
          label="Clear filters"
          onClick={clear}
          className={cn(OUTLINE_BUTTON, "h-12 px-[18px] rounded-[10px] text-[15px] font-semibold")}
        />
        {/* Waits for the stores too, so a search can't start before "All my locations" means something. */}
        <Button
          type="submit"
          label={searching ? "Searching…" : "Show organizations"}
          disabled={searching || !stores}
          className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")}
        />
      </div>
    </form>
  );
}
