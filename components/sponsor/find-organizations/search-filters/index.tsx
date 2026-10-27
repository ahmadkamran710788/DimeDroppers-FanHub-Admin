"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { CARD, FIELD, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import InsetSection from "@/components/sponsor/find-organizations/inset-section";
import { orgSearchSchema } from "@/components/sponsor/find-organizations/schema";
import { DEFAULT_SEARCH, type OrgSearch } from "@/components/sponsor/find-organizations/data";
import type { FilterOption, SponsorSearchFilters } from "@/utils/types/sponsor-packages";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

// The browser's position (it asks the sponsor the first time), rounded to about 10 m; null when it's
// refused, unavailable or too slow.
function currentPosition(): Promise<OrgSearch["near"]> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ lat: Number(coords.latitude.toFixed(4)), lng: Number(coords.longitude.toFixed(4)) }),
      () => resolve(null),
      { timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  });
}

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
  // Waiting for the browser's position.
  const [locating, setLocating] = useState(false);

  function update<K extends keyof OrgSearch>(field: K, value: OrgSearch[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // The search to run: a typed location is the area; with none, a picked radius is measured from the
  // sponsor's position. No radius, or a position they don't share, means any distance (and the radius
  // goes back to unpicked, since it can't apply).
  async function withArea(next: OrgSearch): Promise<OrgSearch> {
    const location = next.location.trim();
    if (location || !next.radius) return { ...next, location, near: null };
    setLocating(true);
    const near = await currentPosition();
    setLocating(false);
    if (near) return { ...next, location, near };
    setForm((prev) => ({ ...prev, radius: "" }));
    toast("Allow location access, or type a city or ZIP code, to search by distance. Showing organizations anywhere.", {
      icon: <TriangleAlert className="size-5 shrink-0 text-[#f59e0b]" aria-hidden="true" />,
    });
    return { ...next, location, radius: "", near: null };
  }

  // Clears the name, type, sports, genders and inventory picks; the area stays.
  async function clear() {
    const next = { ...form, name: "", type: "", sports: [], genders: [], inApp: [], venue: [] };
    setForm(next);
    setErrors({});
    // The results follow straight away, so they never show filters that are no longer set.
    onSearch(await withArea(next));
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(orgSearchSchema, form, setErrors))) return;
    onSearch(await withArea({ ...form, name: form.name.trim() }));
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
          onChange={(e) => update("location", e.target.value)}
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
          disabled={locating}
          className={cn(OUTLINE_BUTTON, "h-12 px-[18px] rounded-[10px] text-[15px] font-semibold")}
        />
        <Button
          type="submit"
          label={locating ? "Finding your location…" : searching ? "Searching…" : "Show organizations"}
          disabled={locating || searching}
          className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")}
        />
      </div>
    </form>
  );
}
