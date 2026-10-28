"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { EMPTY_LOCATION, STATE_OPTIONS, type LocationForm as LocationFields } from "@/components/sponsor/profile/data";
import { locationSchema } from "@/components/sponsor/profile/schema";
import { INPUT, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

const LABEL = "text-[13px] font-normal text-[#c4c4c4]";

interface LocationFormProps {
  onSave: (location: LocationFields) => void;
  onCancel: () => void;
}

// The "New location" panel under the list: name, street, city, state and ZIP.
export default function LocationForm({ onSave, onCancel }: LocationFormProps) {
  const [form, setForm] = useState<LocationFields>(EMPTY_LOCATION);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof LocationFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(locationSchema, form, setErrors))) return;
    onSave({
      name: form.name.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state,
      zip: form.zip.trim(),
    });
  }

  return (
    <form
      onSubmit={save}
      noValidate
      aria-label="New location"
      className="bg-[#17151f] border border-[#4a3f7a] rounded-[12px] p-[18px] flex flex-col gap-[14px]"
    >
      <div className="text-[13px] font-bold tracking-[1px]">NEW LOCATION</div>

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
        <Button label="Cancel" onClick={onCancel} className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")} />
        <Button type="submit" label="Save location" className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")} />
      </div>
    </form>
  );
}
