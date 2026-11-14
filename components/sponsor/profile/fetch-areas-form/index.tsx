"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import MultiSelect, { ALL } from "@/components/common/multi-select";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import {
  MAX_FETCH_CITIES,
  MAX_FETCH_STATES,
  MAX_FETCH_ZIPS,
  STATE_OPTIONS,
} from "@/components/sponsor/profile/data";
import CityGroupRow, { type CityGroup } from "@/components/sponsor/profile/fetch-areas-form/city-group-row";
import ZipRow, { type ZipEntry } from "@/components/sponsor/profile/fetch-areas-form/zip-row";
import { locationFetchSchema } from "@/components/sponsor/profile/schema";
import { SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type { StartLocationFetchBody } from "@/utils/types/sponsor-profile";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";
const LABEL_HINT = "text-xs text-[#8a8a8a]";
const ADD_BUTTON = cn(SMALL_BUTTON, "self-start bg-transparent border border-[#3a3a3a] text-white font-semibold");

// "1 city", "3 cities".
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Errors are kept per row (by its id), so removing a row never moves another row's error onto it.
const cityKey = (id: number, field: "state" | "cities") => `city.${id}.${field}`;
const zipKey = (id: number) => `zip.${id}`;

interface FetchAreasFormProps {
  // Starts the fetch: resolves the API's errors as it reported them (keyed "states", "cities.2.city",
  // "zipCodes.1"…), or null when there are none (started, or the problem was shown another way).
  onSubmit: (body: StartLocationFetchBody) => Promise<Record<string, string> | null>;
  onCancel: () => void;
}

// Where a regional or national brand's fetch searches (FANHUB_SPONSOR_LOCATION_FETCH_ZIP_FRONTEND.md): whole
// states (stores with an address in them), cities picked per state (stores in the city's map area, suburbs
// included) and ZIP codes (only stores with exactly that ZIP code), at least one of any.
export default function FetchAreasForm({ onSubmit, onCancel }: FetchAreasFormProps) {
  const nextId = useRef(2);
  const [states, setStates] = useState<string[]>([]);
  // One empty row of each to start with; empty rows are left out when fetching.
  const [groups, setGroups] = useState<CityGroup[]>([{ id: 0, state: "", cities: [] }]);
  const [zips, setZips] = useState<ZipEntry[]>([{ id: 1, zip: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

  const cityCount = groups.reduce((sum, g) => sum + g.cities.length, 0);
  const zipCount = new Set(zips.map((z) => z.zip.trim()).filter(Boolean)).size;
  const picked = [
    states.length > 0 && count(states.length, "state", "states"),
    cityCount > 0 && count(cityCount, "city", "cities"),
    zipCount > 0 && count(zipCount, "ZIP code", "ZIP codes"),
  ].filter(Boolean);

  const clearError = (...keys: string[]) =>
    setErrors((prev) =>
      keys.some((k) => prev[k]) ? { ...prev, ...Object.fromEntries(keys.map((k) => [k, ""])) } : prev
    );

  const newId = () => nextId.current++;

  function changeGroup(next: CityGroup) {
    setGroups((prev) => prev.map((g) => (g.id === next.id ? next : g)));
    // A city also answers "choose at least one".
    clearError(cityKey(next.id, "state"), cityKey(next.id, "cities"), "cityGroups", "states");
  }

  function changeZip(id: number, zip: string) {
    setZips((prev) => prev.map((z) => (z.id === id ? { ...z, zip } : z)));
    clearError(zipKey(id), "zipCodes", "states");
  }

  // Pasted ZIP codes: the row takes the first, new rows below it the rest (up to the limit).
  function splitZip(id: number, pasted: string[]) {
    setZips((prev) => {
      const at = prev.findIndex((z) => z.id === id);
      const room = Math.max(MAX_FETCH_ZIPS - prev.length, 0);
      const added = pasted.slice(1, 1 + room).map((zip) => ({ id: newId(), zip }));
      return [...prev.slice(0, at), { id, zip: pasted[0] }, ...added, ...prev.slice(at + 1)];
    });
    clearError(zipKey(id), "zipCodes", "states");
  }

  // The API's error paths → the row they belong to. `cityRows[i]` / `zipRows[i]` is the row of the i-th city
  // / ZIP code sent; whatever can't be placed goes under States.
  function rowErrors(found: Record<string, string>, cityRows: number[], zipRows: number[]) {
    const placed: Record<string, string> = {};
    for (const [path, message] of Object.entries(found)) {
      const city = /^cities\.(\d+)\.(city|state)$/.exec(path);
      const zip = /^zipCodes\.(\d+)$/.exec(path);
      const key =
        city && cityRows[+city[1]] !== undefined
          ? cityKey(cityRows[+city[1]], city[2] === "state" ? "state" : "cities")
          : zip && zipRows[+zip[1]] !== undefined
            ? zipKey(zipRows[+zip[1]])
            : path === "cities" || path === "zipCodes"
              ? path.replace("cities", "cityGroups")
              : "states";
      if (!placed[key]) placed[key] = message;
    }
    return placed;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (starting) return;
    const filledGroups = groups.filter((g) => g.state || g.cities.length > 0);
    const filledZips = zips
      .map((z) => ({ id: z.id, zip: z.zip.trim() }))
      .filter((z) => z.zip);

    const form = {
      states,
      cityGroups: filledGroups.map(({ state, cities }) => ({ state, cities })),
      zipCodes: filledZips.map((z) => z.zip),
    };
    const valid = await validateAndSetErrors(locationFetchSchema, form, (found) => {
      // Yup's "cityGroups[2].cities" / "zipCodes[1]" → the row's own key.
      const placed: Record<string, string> = {};
      for (const [path, message] of Object.entries(found)) {
        const group = /^cityGroups\[(\d+)\]\.(state|cities)/.exec(path);
        const zip = /^zipCodes\[(\d+)\]/.exec(path);
        const key = group
          ? cityKey(filledGroups[+group[1]].id, group[2] as "state" | "cities")
          : zip
            ? zipKey(filledZips[+zip[1]].id)
            : path;
        if (!placed[key]) placed[key] = message;
      }
      setErrors(placed);
    });
    if (!valid) return;

    // What's sent, with the row each entry came from (a ZIP code typed twice is sent once).
    const cities = filledGroups.flatMap((g) => g.cities.map((city) => ({ city, state: g.state, row: g.id })));
    const zipCodes = filledZips.filter((z, i) => filledZips.findIndex((other) => other.zip === z.zip) === i);

    setStarting(true);
    const problems = await onSubmit({
      ...(states.length > 0 && { states }),
      ...(cities.length > 0 && { cities: cities.map(({ city, state }) => ({ city, state })) }),
      ...(zipCodes.length > 0 && { zipCodes: zipCodes.map((z) => z.zip) }),
    });
    setStarting(false);
    if (problems) {
      setErrors(
        rowErrors(
          problems,
          cities.map((c) => c.row),
          zipCodes.map((z) => z.id)
        )
      );
    }
  }

  const usedStates = new Set(groups.map((g) => g.state).filter(Boolean));

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Where to search"
      className="bg-[#17151f] border border-[#4a3f7a] rounded-[12px] p-[18px] flex flex-col gap-5"
    >
      <div>
        <div className="text-[13px] font-bold tracking-[1px]">WHERE TO SEARCH</div>
        <p className="text-sm text-white/70 mt-1">Pick any mix of whole states, cities and ZIP codes.</p>
      </div>

      <MultiSelect
        label="States"
        labelHint={<span className={LABEL_HINT}>Every store with an address in the state</span>}
        name="fetch-states"
        value={states}
        onChange={(next) => {
          setStates(next === ALL ? [] : next);
          clearError("states");
        }}
        options={STATE_OPTIONS}
        max={MAX_FETCH_STATES}
        countLabel={(n) => `${n} states`}
        placeholder="No whole states"
        searchPlaceholder="Search states"
        error={errors.states}
        variant="dark"
        labelClassName={LABEL}
        selectClassName={SELECT}
      />

      <fieldset className="flex flex-col gap-3 min-w-0">
        <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <span className={LABEL}>Cities</span>
          <span className={LABEL_HINT}>Stores in the city’s map area, suburbs included</span>
        </legend>
        {groups.map((g, i) => (
          <CityGroupRow
            key={g.id}
            index={i}
            group={g}
            stateOptions={STATE_OPTIONS.filter((o) => o.value === g.state || !usedStates.has(o.value))}
            maxCities={MAX_FETCH_CITIES - (cityCount - g.cities.length)}
            stateError={errors[cityKey(g.id, "state")]}
            citiesError={errors[cityKey(g.id, "cities")]}
            onChange={changeGroup}
            onRemove={() => {
              setGroups((prev) => prev.filter((x) => x.id !== g.id));
              clearError("cityGroups");
            }}
          />
        ))}
        <Button
          label={groups.length > 0 ? "Add cities in another state" : "Add cities in a state"}
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={() => setGroups((prev) => [...prev, { id: newId(), state: "", cities: [] }])}
          disabled={cityCount >= MAX_FETCH_CITIES || usedStates.size >= STATE_OPTIONS.length}
          className={ADD_BUTTON}
        />
        {errors.cityGroups && <p className="text-sm text-error">{errors.cityGroups}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-3 min-w-0">
        <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <span className={LABEL}>ZIP codes</span>
          <span className={LABEL_HINT}>Only stores with exactly that ZIP code</span>
        </legend>
        {zips.map((z, i) => (
          <ZipRow
            key={z.id}
            index={i}
            entry={z}
            error={errors[zipKey(z.id)]}
            onChange={(zip) => changeZip(z.id, zip)}
            onSplit={(pasted) => splitZip(z.id, pasted)}
            onRemove={() => {
              setZips((prev) => prev.filter((x) => x.id !== z.id));
              clearError("zipCodes");
            }}
          />
        ))}
        <Button
          label="Add a ZIP code"
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={() => setZips((prev) => [...prev, { id: newId(), zip: "" }])}
          disabled={zips.length >= MAX_FETCH_ZIPS}
          className={ADD_BUTTON}
        />
        {errors.zipCodes && <p className="text-sm text-error">{errors.zipCodes}</p>}
      </fieldset>

      <div className="flex items-center justify-between gap-3 flex-wrap border-t border-[#2e2a40] pt-4">
        <p role="status" className="text-sm text-[#c4c4c4]">
          {picked.length > 0 ? `Searching ${picked.join(" · ")}` : "Pick at least one state, city or ZIP code."}
        </p>
        <div className="flex gap-[10px] flex-wrap ml-auto">
          <Button
            label="Cancel"
            onClick={onCancel}
            disabled={starting}
            className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")}
          />
          <Button
            type="submit"
            label={starting ? "Starting…" : "Fetch locations"}
            disabled={starting || picked.length === 0}
            className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")}
          />
        </div>
      </div>
    </form>
  );
}
