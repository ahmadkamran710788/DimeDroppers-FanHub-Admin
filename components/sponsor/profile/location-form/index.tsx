"use client";

import { useId, useState } from "react";
import { cn } from "@/utils/cn";
import { coordinateText } from "@/utils/helper";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import Input from "@/components/common/input";
import LocationPicker, { type PickedPlace } from "@/components/common/location-picker";
import Select from "@/components/common/select";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { EMPTY_LOCATION, STATE_OPTIONS, type LocationFields } from "@/components/sponsor/profile/data";
import { locationSchema } from "@/components/sponsor/profile/schema";
import { INPUT, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";

interface LocationFormProps {
  // The location being edited; a new one starts empty.
  initial?: LocationFields;
  // Offers "Make this my main location" (a new location, when there is a main one already; the first one
  // becomes main by itself).
  offerMain?: boolean;
  // Saves the trimmed fields: resolves the errors to show under the fields, or null when there are none
  // (saved, or the problem was shown another way).
  onSave: (location: LocationFields, makeMain: boolean) => Promise<Record<string, string> | null>;
  onCancel: () => void;
}

// The new / edit location panel: address search and map, then name, street, city, state, ZIP, latitude and
// longitude. Anything that places it on the map is enough (a street, a city with a state, a ZIP, or a pin);
// the address is looked up when it's saved, unless the pin is set here (the map sets it).
export default function LocationForm({ initial, offerMain = false, onSave, onCancel }: LocationFormProps) {
  const [form, setForm] = useState<LocationFields>(initial ?? EMPTY_LOCATION);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [makeMain, setMakeMain] = useState(false);
  const [saving, setSaving] = useState(false);
  const id = useId();
  const title = initial ? "EDIT LOCATION" : "NEW LOCATION";

  // From the map: a picked address fills every address part and the pin; a moved pin only the pin. Their
  // errors (and the street's "where is it") go with them.
  function setFromMap(fields: Partial<LocationFields>) {
    setForm((prev) => ({ ...prev, ...fields }));
    const cleared = [...Object.keys(fields), "street"];
    setErrors((prev) =>
      cleared.some((f) => prev[f]) ? { ...prev, ...Object.fromEntries(cleared.map((f) => [f, ""])) } : prev
    );
  }

  const pickPlace = (place: PickedPlace) =>
    setFromMap({
      street: place.street,
      city: place.city,
      state: place.state,
      zip: place.zip,
      latitude: coordinateText(place.latitude),
      longitude: coordinateText(place.longitude),
    });

  const setField = (field: keyof LocationFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    // The street also holds the "where is it" errors (nothing to place it by, not found on the map), which
    // a change to any address part or the pin answers; latitude and longitude share "enter both".
    const cleared =
      field === "name"
        ? ["name"]
        : field === "latitude" || field === "longitude"
          ? ["latitude", "longitude", "street"]
          : [field, "street"];
    setErrors((prev) =>
      cleared.some((f) => prev[f]) ? { ...prev, ...Object.fromEntries(cleared.map((f) => [f, ""])) } : prev
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !(await validateAndSetErrors(locationSchema, form, setErrors))) return;
    setSaving(true);
    const problems = await onSave(
      {
        name: form.name.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state,
        zip: form.zip.trim(),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
      },
      offerMain && makeMain
    );
    setSaving(false);
    if (problems) setErrors(problems);
  }

  return (
    <form
      onSubmit={save}
      noValidate
      aria-label={initial ? "Edit location" : "New location"}
      className="bg-[#17151f] border border-[#4a3f7a] rounded-[12px] p-[18px] flex flex-col gap-[14px]"
    >
      <div className="text-[13px] font-bold tracking-[1px]">{title}</div>

      <LocationPicker
        name={`${id}-map`}
        latitude={form.latitude}
        longitude={form.longitude}
        onPlace={pickPlace}
        onPin={(latitude, longitude) =>
          setFromMap({ latitude: coordinateText(latitude), longitude: coordinateText(longitude) })
        }
        labelClassName={LABEL}
        inputClassName={INPUT}
      />

      {/* Name and street on their own rows; city, state and ZIP share one, latitude and longitude the next. */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <Input
          label="Location name"
          name="location-name"
          value={form.name}
          onChange={setField("name")}
          placeholder="e.g. Madison office"
          error={errors.name}
          variant="dark"
          className="col-span-full"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="Street address"
          name="location-street"
          value={form.street}
          onChange={setField("street")}
          placeholder="Street and number"
          autoComplete="address-line1"
          error={errors.street}
          variant="dark"
          className="col-span-full"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="City"
          name="location-city"
          value={form.city}
          onChange={setField("city")}
          autoComplete="address-level2"
          error={errors.city}
          variant="dark"
          className="min-w-0 sm:col-span-2"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <Select
          label="State"
          name="location-state"
          value={form.state}
          onChange={setField("state")}
          options={STATE_OPTIONS}
          placeholder="Choose"
          error={errors.state}
          variant="dark"
          className="min-w-0 sm:col-span-2"
          labelClassName={LABEL}
          selectClassName={SELECT}
        />
        <Input
          label="ZIP code"
          name="location-zip"
          value={form.zip}
          onChange={setField("zip")}
          autoComplete="postal-code"
          error={errors.zip}
          variant="dark"
          className="min-w-0 sm:col-span-2"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="Latitude"
          name="location-latitude"
          value={form.latitude}
          onChange={setField("latitude")}
          placeholder="e.g. 45.669817"
          error={errors.latitude}
          variant="dark"
          className="min-w-0 sm:col-span-3"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="Longitude"
          name="location-longitude"
          value={form.longitude}
          onChange={setField("longitude")}
          placeholder="e.g. -122.663238"
          error={errors.longitude}
          variant="dark"
          className="min-w-0 sm:col-span-3"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
        <p className="col-span-full text-sm text-white/70">
          Set by the map. Left empty, the pin is placed from the address.
        </p>
      </div>

      {offerMain && (
        <div className="flex items-center gap-px min-h-11 text-[15px] text-[#e0e0e0]">
          <Button
            id={`${id}-main`}
            size="icon"
            icon={<Checkbox variant="violet" checked={makeMain} />}
            role="checkbox"
            aria-checked={makeMain}
            aria-label="Make this my main location"
            onClick={() => setMakeMain((prev) => !prev)}
            className="size-11 -ml-[11px] bg-transparent backdrop-blur-none"
          />
          <label htmlFor={`${id}-main`} className="cursor-pointer">
            Make this my main location
          </label>
        </div>
      )}

      <div className="flex justify-end gap-[10px] flex-wrap">
        <Button
          label="Cancel"
          onClick={onCancel}
          disabled={saving}
          className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")}
        />
        <Button
          type="submit"
          label={saving ? "Saving…" : "Save location"}
          disabled={saving}
          className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")}
        />
      </div>
    </form>
  );
}
