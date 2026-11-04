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
// Each group of filters sits in its own card.
const SECTION = cn(CARD, "rounded-[8px] p-4 lg:p-6 flex flex-col gap-6 min-w-0");
const HINT = "text-[13px] text-[#a8a8a8]";
// A text button that reads as a link inside a hint.
const LINK = "inline text-[13px] font-normal text-[#c9b8ff] underline hover:text-white";

// The form as typed: the stores and radius stay null until the sponsor changes them, so they follow the
// default (All my locations at the default radius) once the stores and filters have loaded.
interface FilterForm extends Omit<OrgSearch, "stores" | "radius"> {
  stores: MultiSelectValue | null;
  radius: string | null;
}

interface SearchFiltersProps {
  // The chips and radius default from GET /filters; null while they load.
  filters: SponsorSearchFilters | null;
  // The brand's stores that can be searched near; null while they load.
  stores: SponsorStore[] | null;
  // Called with the validated filters when the sponsor presses Show organizations.
  onSearch: (search: OrgSearch) => void;
  // A search has run, so results are showing; until then Clear filters only resets the form.
  searched?: boolean;
  // A search is running: the button waits.
  searching?: boolean;
}

const chipOptions = (options: FilterOption[] | undefined, disabled = false) =>
  (options ?? []).map((o) => ({ label: o.label, value: o.code, disabled }));

// Where the sponsor searches either by organization (name, type) or near their stores (locations, radius),
// then narrows by budget, season, sports, genders and physical asset categories. Changes apply on submit.
// It shows straight away; only the Locations list waits for the stores.
export default function SearchFilters({
  filters,
  stores,
  onSearch,
  searched = false,
  searching = false,
}: SearchFiltersProps) {
  const [form, setForm] = useState<FilterForm>({ ...DEFAULT_SEARCH, stores: null, radius: null });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Untouched, the area is all the stores at the default radius (anywhere without stores).
  const current: OrgSearch = {
    ...form,
    stores: form.stores ?? (stores?.length ? ALL : []),
    radius: form.radius ?? (filters ? String(filters.radiusDefaultMiles) : ""),
  };

  // The search is by organization or by location, never both: while one is in use the other is greyed out.
  // With neither, it's near the stores (the default).
  const orgInUse = form.name.trim() !== "" || form.type !== "";
  const areaInUse = !orgInUse && (form.stores !== null || form.radius !== null);
  // By organization, it's anywhere (no stores, no radius).
  const applied: OrgSearch = orgInUse ? { ...current, stores: [], radius: "" } : current;

  function update<K extends keyof FilterForm>(field: K, value: FilterForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // Frees the location fields again.
  function clearOrg() {
    setForm((prev) => ({ ...prev, name: "", type: "" }));
    setErrors((prev) => ({ ...prev, name: "" }));
  }

  // Back to the default area, which frees the organization fields again.
  function clearArea() {
    setForm((prev) => ({ ...prev, stores: null, radius: null }));
    setErrors((prev) => ({ ...prev, radius: "" }));
  }

  // Clears the name, type, budget, season, sports, genders and physical asset category picks; the area
  // stays.
  async function clear() {
    const next = {
      ...form,
      name: "",
      type: "",
      budget: "",
      season: "",
      sports: [],
      genders: [],
      assetCategories: [],
    };
    setForm(next);
    setErrors({});
    // Nothing is showing yet, so there are no results to refresh.
    if (!searched) return;
    // The results follow straight away, so they never show filters that are no longer set; a radius that
    // isn't valid yet keeps its error and the results wait for it.
    const cleared = { ...current, ...next, stores: current.stores, radius: current.radius };
    if (await validateAndSetErrors(orgSearchSchema, cleared, setErrors)) onSearch(cleared);
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(orgSearchSchema, applied, setErrors))) return;
    onSearch({ ...applied, name: applied.name.trim(), budget: applied.budget.trim() });
  }

  return (
    <form aria-label="Filters" noValidate onSubmit={search} className="flex flex-col gap-6">
      {/* Where to search: by organization or near the brand's locations. */}
      <section aria-label="Organization or location" className={SECTION}>
        {/* By organization. */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4 items-start">
            <Input
              label="ORGANIZATION NAME"
              labelHint={
                <span className={cn(HINT, areaInUse && "opacity-50")}>
                  Search by organization to find the sponsorship packages they have available
                </span>
              }
              name="org-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Search by name"
              error={errors.name}
              maxLength={120}
              disabled={areaInUse}
              className="min-w-0"
              labelClassName={cn(SECTION_LABEL, areaInUse && "opacity-50")}
              inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
            />
            <div className="flex flex-col gap-[10px] min-w-0">
              <div className={cn(SECTION_LABEL, areaInUse && "opacity-50")}>ORGANIZATION TYPE</div>
              <FilterChips
                variant="pill"
                ariaLabel="Organization type"
                options={[{ label: "All", value: "", disabled: areaInUse }, ...chipOptions(filters?.organizationTypes, areaInUse)]}
                value={form.type}
                onChange={(type) => update("type", type)}
              />
            </div>
          </div>
          {areaInUse && (
            <p className={HINT}>
              Searching near your brand locations.{" "}
              <Button variant="text" size="sm" label="Clear the location search" onClick={clearArea} className={LINK} /> to
              search by organization instead.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-[13px] font-bold tracking-[1px] text-[#a8a8a8]">
          <span className="h-px flex-1 bg-[#262626]" aria-hidden />
          OR
          <span className="h-px flex-1 bg-[#262626]" aria-hidden />
        </div>

        {/* By location. Brand locations takes two of the 200px columns once there's room for two. One radius
            applies to every picked store (the API takes one). Both fields share the grid's rows (label, field,
            error) as subgrids, so the two fields stay level when the hint wraps or the radius shows an error. */}
        <div className="flex flex-col gap-2">
          <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-2">
            <MultiSelect
              label="BRAND LOCATIONS"
              labelHint={
                <span className={cn(HINT, orgInUse && "opacity-50")}>
                  Search by your brand locations to find the organizations with sponsorship packages near them
                </span>
              }
              name="org-locations"
              value={current.stores}
              onChange={(picked) => update("stores", picked)}
              options={(stores ?? []).map((s) => ({ label: s.label, value: s.id, hint: s.hint }))}
              allLabel={`All my locations (${stores?.length ?? 0})`}
              max={MAX_PICKED_STORES}
              countLabel={(count) => `${count} locations`}
              placeholder={!stores ? "Loading your locations…" : stores.length ? "Anywhere" : "No locations yet"}
              searchPlaceholder="Search your locations"
              disabled={!stores?.length || orgInUse}
              variant="dark"
              className="min-w-0 @min-[416px]:col-span-2 row-span-2 grid grid-cols-1 grid-rows-subgrid"
              labelClassName={cn(SECTION_LABEL, orgInUse && "opacity-50")}
              selectClassName={cn(CONTROL, "px-3")}
            />
            {/* Whole miles only; checked against the API's limit on submit. The label sits on its field, and a
                third row opens for the error. Stacked (under three columns), it keeps 16px from the field above. */}
            <Input
              label="RADIUS (MILES)"
              name="org-radius"
              value={current.radius}
              onChange={(e) => update("radius", e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder={String(filters?.radiusDefaultMiles ?? 25)}
              inputMode="numeric"
              disabled={!searchesNearStores(applied)}
              error={errors.radius}
              className={cn(
                "min-w-0 row-span-2 grid grid-cols-1 grid-rows-subgrid @max-[632px]:mt-2",
                errors.radius && "row-span-3"
              )}
              labelClassName={cn(SECTION_LABEL, "self-end", orgInUse && "opacity-50")}
              inputClassName={cn(CONTROL, "py-0 px-[14px] placeholder:text-[#757575]")}
            />
          </div>
          {stores && !stores.length ? (
            <p className={HINT}>
              Add your locations on your{" "}
              <Link href={routes.ui.sponsor.profile} className="text-[#c9b8ff] underline hover:text-white">
                Sponsor Profile
              </Link>{" "}
              to find organizations near them.
            </p>
          ) : (
            orgInUse && (
              <p className={HINT}>
                Searching by organization.{" "}
                <Button variant="text" size="sm" label="Clear the organization search" onClick={clearOrg} className={LINK} />{" "}
                to search near your brand locations instead.
              </p>
            )
          )}
        </div>
      </section>

      {/* Works with either search: only organizations with a package within the budget, and with games in the
          season. */}
      <section aria-label="Budget, season, sports and gender" className={SECTION}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
          <Input
            label="SPONSOR BUDGET"
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
            <div className={HINT}>{`${form.sports.length} selected`}</div>
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
            <div className={HINT}>{`${form.genders.length} selected`}</div>
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
      </section>

      {/* The organization's physical assets, by the category it gave them (the list from GET /filters). It keeps
          organizations with a sponsor-enabled asset in any picked category; tournaments are checked per event. */}
      <section aria-label="Physical asset category" className={cn(SECTION, "gap-3")}>
        <div>
          <div className={SECTION_LABEL}>PHYSICAL ASSET CATEGORY</div>
          <div className={cn(HINT, "mt-[2px]")}>Physical assets the organization offers, by type</div>
        </div>
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
      </section>

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
