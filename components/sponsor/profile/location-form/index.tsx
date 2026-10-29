"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { EMPTY_LOCATION, STATE_OPTIONS, type LocationFields } from "@/components/sponsor/profile/data";
import { locationSchema } from "@/components/sponsor/profile/schema";
import { INPUT, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";

interface LocationFormProps {
  // The location being edited; a new one starts empty.
  initial?: LocationFields;
  // Saves the trimmed fields: resolves the errors to show under the fields, or null when there are none
  // (saved, or the problem was shown another way).
  onSave: (location: LocationFields) => Promise<Record<string, string> | null>;
  onCancel: () => void;
}

// The new / edit location panel: name, street, city, state and ZIP. Anything that places it on the map is
// enough (a street, a city with a state, or a ZIP); the address is looked up when it's saved.
export default function LocationForm({ initial, onSave, onCancel }: LocationFormProps) {
  const [form, setForm] = useState<LocationFields>(initial ?? EMPTY_LOCATION);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const title = initial ? "EDIT LOCATION" : "NEW LOCATION";

  const setField = (field: keyof LocationFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    // The street also holds the "where is it" errors (nothing to place it by, not found on the map), which
    // a change to any address part answers.
    const cleared = field === "name" ? ["name"] : [field, "street"];
    setErrors((prev) =>
      cleared.some((f) => prev[f]) ? { ...prev, ...Object.fromEntries(cleared.map((f) => [f, ""])) } : prev
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !(await validateAndSetErrors(locationSchema, form, setErrors))) return;
    setSaving(true);
    const problems = await onSave({
      name: form.name.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state,
      zip: form.zip.trim(),
    });
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

      {/* Name and street on their own rows; city, state and ZIP share one. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          className="min-w-0"
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
          className="min-w-0"
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
          className="min-w-0"
          labelClassName={LABEL}
          inputClassName={INPUT}
        />
      </div>

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
