"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import MultiSelect, { ALL } from "@/components/common/multi-select";
import Select from "@/components/common/select";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { MAX_FETCH_CITIES, MAX_FETCH_STATES, STATE_OPTIONS } from "@/components/sponsor/profile/data";
import { locationFetchSchema } from "@/components/sponsor/profile/schema";
import { INPUT, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type { StartLocationFetchBody } from "@/utils/types/sponsor-profile";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";

// A city row; `id` keeps the row (and its focus) when one above it is removed.
interface CityRow {
  id: number;
  city: string;
  state: string;
}

// Yup's "cities[2].city" as the API reports it: "cities.2.city".
const dotted = (errors: Record<string, string>) =>
  Object.fromEntries(Object.entries(errors).map(([path, message]) => [path.replace(/\[(\d+)\]/g, ".$1"), message]));

interface FetchAreasFormProps {
  // Starts the fetch: resolves the errors to show (keyed "states", "cities.2.city"…), or null when there are
  // none (started, or the problem was shown another way).
  onSubmit: (body: StartLocationFetchBody) => Promise<Record<string, string> | null>;
  onCancel: () => void;
}

// Where a regional or national brand's fetch searches: any states (stores with an address in them) and any
// cities (stores in the city's map area, suburbs included), at least one of either.
export default function FetchAreasForm({ onSubmit, onCancel }: FetchAreasFormProps) {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);
  const nextId = useRef(0);

  const clearError = (...keys: string[]) =>
    setErrors((prev) =>
      keys.some((k) => prev[k]) ? { ...prev, ...Object.fromEntries(keys.map((k) => [k, ""])) } : prev
    );

  function setCity(index: number, field: "city" | "state", value: string) {
    setCities((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    // A city also answers "choose at least one".
    clearError(`cities.${index}.${field}`, "states");
  }

  function addCity() {
    const id = nextId.current++;
    setCities((prev) => [...prev, { id, city: "", state: "" }]);
  }

  // The rows below move up, so their errors would sit on the wrong row: they're cleared.
  function removeCity(index: number) {
    setCities((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith("cities."))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const picked = { states, cities: cities.map((c) => ({ city: c.city.trim(), state: c.state })) };
    if (starting || !(await validateAndSetErrors(locationFetchSchema, picked, (found) => setErrors(dotted(found))))) {
      return;
    }
    setStarting(true);
    const problems = await onSubmit({
      ...(picked.states.length > 0 && { states: picked.states }),
      ...(picked.cities.length > 0 && { cities: picked.cities }),
    });
    setStarting(false);
    if (problems) setErrors(problems);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Where to search"
      className="bg-[#17151f] border border-[#4a3f7a] rounded-[12px] p-[18px] flex flex-col gap-[14px]"
    >
      <div>
        <div className="text-[13px] font-bold tracking-[1px]">WHERE TO SEARCH</div>
        <p className="text-sm text-white/70 mt-1">
          Pick states, cities, or both. A city includes its suburbs; a state, every store with an address in it.
        </p>
      </div>

      <MultiSelect
        label="States"
        name="fetch-states"
        value={states}
        onChange={(picked) => {
          setStates(picked === ALL ? [] : picked);
          clearError("states");
        }}
        options={STATE_OPTIONS}
        max={MAX_FETCH_STATES}
        countLabel={(count) => `${count} states`}
        placeholder="No states"
        searchPlaceholder="Search states"
        error={errors.states}
        variant="dark"
        labelClassName={LABEL}
        selectClassName={SELECT}
      />

      <div className="flex flex-col gap-2">
        <div className={LABEL}>Cities</div>
        {cities.map((c, i) => (
          <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] gap-2 items-start">
            <Input
              label={`City ${i + 1}`}
              name={`fetch-city-${c.id}`}
              value={c.city}
              onChange={(e) => setCity(i, "city", e.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              error={errors[`cities.${i}.city`]}
              variant="dark"
              className="min-w-0"
              labelClassName="sr-only"
              inputClassName={INPUT}
            />
            <Select
              label={`State of city ${i + 1}`}
              name={`fetch-city-state-${c.id}`}
              value={c.state}
              onChange={(e) => setCity(i, "state", e.target.value)}
              options={STATE_OPTIONS}
              placeholder="State"
              error={errors[`cities.${i}.state`]}
              variant="dark"
              className="min-w-0"
              labelClassName="sr-only"
              selectClassName={SELECT}
            />
            <Button
              size="icon"
              icon={<X className="size-4" strokeWidth={2} />}
              aria-label={`Remove ${c.city.trim() || `city ${i + 1}`}`}
              onClick={() => removeCity(i)}
              className="size-12 rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#d4d4d4] backdrop-blur-none"
            />
          </div>
        ))}
        <Button
          label="Add a city"
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={addCity}
          disabled={cities.length >= MAX_FETCH_CITIES}
          className={cn(SMALL_BUTTON, "self-start bg-transparent border border-[#3a3a3a] text-white font-semibold")}
        />
        {errors.cities && <p className="text-sm text-error">{errors.cities}</p>}
      </div>

      <div className="flex justify-end gap-[10px] flex-wrap">
        <Button
          label="Cancel"
          onClick={onCancel}
          disabled={starting}
          className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")}
        />
        <Button
          type="submit"
          label={starting ? "Starting…" : "Fetch locations"}
          disabled={starting}
          className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")}
        />
      </div>
    </form>
  );
}
