"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { MAX_FETCH_CITIES, MAX_FETCH_ZIPS, STATE_OPTIONS } from "@/components/sponsor/profile/data";
import CityGroupRow, { type CityGroup } from "@/components/sponsor/profile/fetch-areas-form/city-group-row";
import ZipRow, { type ZipEntry } from "@/components/sponsor/profile/fetch-areas-form/zip-row";
import { locationFetchSchema } from "@/components/sponsor/profile/schema";
import { SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type { StartLocationFetchBody } from "@/utils/types/sponsor-profile";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";
const LABEL_HINT = "text-xs text-[#8a8a8a]";
const ADD_BUTTON = cn(SMALL_BUTTON, "self-start bg-transparent border border-[#3a3a3a] text-white font-semibold");

// "1 city", "3 cities".
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Errors are kept per row (by its id), so removing a row never moves another row's error onto it.
const cityKey = (id: number, field: "state" | "cities") => `city.${id}.${field}`;
const zipKey = (id: number) => `zip.${id}`;

// Puts the cursor in a ZIP field just added (once it's rendered).
const focusZip = (id: number) => requestAnimationFrame(() => document.getElementById(`fetch-zip-${id}`)?.focus());

interface FetchAreasFormProps {
  // Starts the fetch: resolves the API's errors as it reported them (keyed "states.1", "cities.2.city",
  // "zipCodes.1"…), or null when there are none (started, or the problem was shown another way).
  onSubmit: (body: StartLocationFetchBody) => Promise<Record<string, string> | null>;
  onCancel: () => void;
}

// Where a regional or national brand's fetch searches (FANHUB_SPONSOR_LOCATION_FETCH_ZIP_FRONTEND.md). Each row
// is a state: with no cities it searches the whole state (stores with an address in it); with cities, only those
// (stores in each city's map area, suburbs included). ZIP codes (only stores with exactly that ZIP code) are
// optional and hidden until asked for. At least one state or ZIP code.
export default function FetchAreasForm({ onSubmit, onCancel }: FetchAreasFormProps) {
  const nextId = useRef(1);
  // One empty state row to start with; empty rows are left out when fetching.
  const [groups, setGroups] = useState<CityGroup[]>([{ id: 0, state: "", cities: [] }]);
  // None until the sponsor chooses to search by ZIP code.
  const [zips, setZips] = useState<ZipEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

  const wholeStates = groups.filter((g) => g.state && g.cities.length === 0).length;
  const cityCount = groups.reduce((sum, g) => sum + g.cities.length, 0);
  const zipCount = new Set(zips.map((z) => z.zip.trim()).filter(Boolean)).size;
  const picked = [
    wholeStates > 0 && count(wholeStates, "whole state", "whole states"),
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
    // A state also answers "choose at least one".
    clearError(cityKey(next.id, "state"), cityKey(next.id, "cities"), "cityGroups");
  }

  function addZip() {
    const id = newId();
    setZips((prev) => [...prev, { id, zip: "" }]);
    focusZip(id);
  }

  function changeZip(id: number, zip: string) {
    setZips((prev) => prev.map((z) => (z.id === id ? { ...z, zip } : z)));
    clearError(zipKey(id), "zipCodes", "cityGroups");
  }

  // Pasted ZIP codes: the row takes the first, new rows below it the rest (up to the limit).
  function splitZip(id: number, pasted: string[]) {
    setZips((prev) => {
      const at = prev.findIndex((z) => z.id === id);
      const room = Math.max(MAX_FETCH_ZIPS - prev.length, 0);
      const added = pasted.slice(1, 1 + room).map((zip) => ({ id: newId(), zip }));
      return [...prev.slice(0, at), { id, zip: pasted[0] }, ...added, ...prev.slice(at + 1)];
    });
    clearError(zipKey(id), "zipCodes", "cityGroups");
  }

  // The API's error paths → the row they belong to. `stateRows[i]` / `cityRows[i]` / `zipRows[i]` is the row of
  // the i-th whole state / city / ZIP code sent; whatever can't be placed goes under the states and cities.
  function rowErrors(found: Record<string, string>, stateRows: number[], cityRows: number[], zipRows: number[]) {
    const placed: Record<string, string> = {};
    for (const [path, message] of Object.entries(found)) {
      const state = /^states\.(\d+)$/.exec(path);
      const city = /^cities\.(\d+)\.(city|state)$/.exec(path);
      const zip = /^zipCodes\.(\d+)$/.exec(path);
      const key =
        state && stateRows[+state[1]] !== undefined
          ? cityKey(stateRows[+state[1]], "state")
          : city && cityRows[+city[1]] !== undefined
            ? cityKey(cityRows[+city[1]], city[2] === "state" ? "state" : "cities")
            : zip && zipRows[+zip[1]] !== undefined
              ? zipKey(zipRows[+zip[1]])
              : path === "zipCodes"
                ? "zipCodes"
                : "cityGroups";
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

    // What's sent, with the row each entry came from: a state without cities is searched whole, a state with
    // cities only in those cities (a ZIP code typed twice is sent once).
    const states = filledGroups.filter((g) => g.cities.length === 0).map((g) => ({ state: g.state, row: g.id }));
    const cities = filledGroups.flatMap((g) => g.cities.map((city) => ({ city, state: g.state, row: g.id })));
    const zipCodes = filledZips.filter((z, i) => filledZips.findIndex((other) => other.zip === z.zip) === i);

    setStarting(true);
    const problems = await onSubmit({
      ...(states.length > 0 && { states: states.map((s) => s.state) }),
      ...(cities.length > 0 && { cities: cities.map(({ city, state }) => ({ city, state })) }),
      ...(zipCodes.length > 0 && { zipCodes: zipCodes.map((z) => z.zip) }),
    });
    setStarting(false);
    if (problems) {
      setErrors(
        rowErrors(
          problems,
          states.map((s) => s.row),
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
        <p className="text-sm text-white/70 mt-1">
          Pick a state to search all of it, or pick some of its cities to search only those.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3 min-w-0">
        <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <span className={LABEL}>States and cities</span>
          <span className={LABEL_HINT}>No cities searches the whole state; a city includes its suburbs</span>
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
          label={groups.length > 0 ? "Add another state" : "Add a state"}
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={() => setGroups((prev) => [...prev, { id: newId(), state: "", cities: [] }])}
          disabled={usedStates.size >= STATE_OPTIONS.length}
          className={ADD_BUTTON}
        />
        {errors.cityGroups && <p className="text-sm text-error">{errors.cityGroups}</p>}
      </fieldset>

      {/* ZIP codes are optional: hidden until the sponsor asks for them, and hidden again when the last is removed. */}
      {zips.length === 0 ? (
        <div className="flex flex-col gap-2">
          <Button
            label="Search by ZIP code"
            icon={<Plus className="size-4" strokeWidth={2.4} />}
            onClick={addZip}
            className={ADD_BUTTON}
          />
          {errors.zipCodes && <p className="text-sm text-error">{errors.zipCodes}</p>}
        </div>
      ) : (
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
                clearError(zipKey(z.id), "zipCodes");
              }}
            />
          ))}
          <Button
            label="Add a ZIP code"
            icon={<Plus className="size-4" strokeWidth={2.4} />}
            onClick={addZip}
            disabled={zips.length >= MAX_FETCH_ZIPS}
            className={ADD_BUTTON}
          />
          {errors.zipCodes && <p className="text-sm text-error">{errors.zipCodes}</p>}
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap border-t border-[#2e2a40] pt-4">
        <p role="status" className="text-sm text-[#c4c4c4]">
          {picked.length > 0 ? `Searching ${picked.join(" · ")}` : "Pick at least one state or ZIP code."}
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
