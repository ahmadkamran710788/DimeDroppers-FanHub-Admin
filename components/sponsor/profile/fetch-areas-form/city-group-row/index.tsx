"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import Button from "@/components/common/button";
import MultiSelect, { ALL } from "@/components/common/multi-select";
import Select from "@/components/common/select";
import { STATE_OPTIONS } from "@/components/sponsor/profile/data";
import { SELECT } from "@/components/sponsor/profile/styles";
import { useStateCities } from "@/components/sponsor/profile/use-us-places";

// A state's city list is long (Texas has about 1,500): only this many are listed until the search narrows it.
const CITIES_SHOWN = 200;

// One row of the picker: a state and some of its cities.
export interface CityGroup {
  // Keeps the row (and its focus) when one above it is removed.
  id: number;
  // Two-letter code; "" until picked.
  state: string;
  cities: string[];
}

interface CityGroupRowProps {
  index: number;
  group: CityGroup;
  // The states this row can take: all but the ones other rows have.
  stateOptions: { label: string; value: string }[];
  // How many cities this row can hold, within the fetch's limit across all rows.
  maxCities: number;
  stateError?: string;
  citiesError?: string;
  onChange: (group: CityGroup) => void;
  onRemove: () => void;
}

// "fort worth" as typed → "Fort Worth"; a name typed with capitals is kept as it is.
const cityName = (typed: string) => {
  const name = typed.trim().replace(/\s+/g, " ");
  return name === name.toLowerCase() ? name.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : name;
};

// A state, then any of its cities from the US ZIP list. A town missing from the list can be typed and added,
// so any city can still be searched.
export default function CityGroupRow({
  index,
  group,
  stateOptions,
  maxCities,
  stateError,
  citiesError,
  onChange,
  onRemove,
}: CityGroupRowProps) {
  const { cities, loading, failed } = useStateCities(group.state);
  const stateName = STATE_OPTIONS.find((o) => o.value === group.state)?.label ?? "";

  // Typed cities that aren't in the list come first, so they show (ticked) with the rest.
  const options = useMemo(() => {
    const known = new Set(cities);
    return [...group.cities.filter((c) => !known.has(c)), ...cities].map((c) => ({ label: c, value: c }));
  }, [cities, group.cities]);

  function addTyped(typed: string) {
    const name = cityName(typed);
    if (!name || group.cities.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    onChange({ ...group, cities: [...group.cities, name] });
  }

  const placeholder = !group.state ? "Pick a state first" : loading ? "Loading cities…" : "Pick cities";
  const where = stateName || `row ${index + 1}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] gap-2 items-start">
        <Select
          label={`State of cities row ${index + 1}`}
          name={`fetch-group-state-${group.id}`}
          value={group.state}
          // The cities belong to the old state: a new state starts with none.
          onChange={(e) => onChange({ ...group, state: e.target.value, cities: [] })}
          options={stateOptions}
          placeholder="State"
          error={stateError}
          variant="dark"
          className="min-w-0"
          labelClassName="sr-only"
          selectClassName={SELECT}
        />
        <MultiSelect
          label={`Cities in ${where}`}
          name={`fetch-group-cities-${group.id}`}
          value={group.cities}
          onChange={(picked) => onChange({ ...group, cities: picked === ALL ? [] : picked })}
          options={options}
          max={maxCities}
          maxShown={CITIES_SHOWN}
          onCreate={addTyped}
          createLabel={(typed) => `Add "${cityName(typed)}"`}
          countLabel={(count) => `${count} cities`}
          placeholder={placeholder}
          searchPlaceholder={stateName ? `Search cities in ${stateName}` : "Search cities"}
          disabled={!group.state}
          error={citiesError}
          variant="dark"
          className="min-w-0"
          labelClassName="sr-only"
          selectClassName={SELECT}
        />
        <Button
          size="icon"
          icon={<X className="size-4" strokeWidth={2} />}
          aria-label={`Remove the cities in ${where}`}
          onClick={onRemove}
          className="size-12 rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#d4d4d4] backdrop-blur-none"
        />
      </div>

      {failed && (
        <p className="text-sm text-[#a8a8a8]">
          Couldn’t load the cities of {stateName}. Open the list and type a city to add it.
        </p>
      )}

      {group.cities.length > 0 && (
        <ul aria-label={`Cities picked in ${where}`} className="flex flex-wrap gap-2">
          {group.cities.map((city) => (
            <li
              key={city}
              className="flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-[#2a2148] border border-[#4a3f7a] text-sm text-white"
            >
              <span className="break-words">{city}</span>
              <Button
                size="icon"
                icon={<X className="size-3.5" strokeWidth={2.4} />}
                aria-label={`Remove ${city}`}
                onClick={() => onChange({ ...group, cities: group.cities.filter((c) => c !== city) })}
                className="size-6 bg-transparent text-[#c9b8ff] hover:bg-white/10 hover:text-white backdrop-blur-none"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
