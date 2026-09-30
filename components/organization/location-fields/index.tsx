"use client";

import { MapPin } from "lucide-react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import {
  US_STATE_OPTIONS,
  FIELD_GRID,
  FIELD_LABEL,
  type FieldGroupProps,
} from "@/components/organization/form";

export default function LocationFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={FIELD_GRID}>
      <Input label="Street Address" name="streetAddress" value={form.streetAddress} onChange={set("streetAddress")} placeholder="1234 Lakeview Dr" icon={<MapPin className="w-5 h-5" />} error={errors.streetAddress} className="sm:col-span-2" labelClassName={FIELD_LABEL} />
      <Input label="City" name="city" value={form.city} onChange={set("city")} placeholder="Fort Lauderdale" error={errors.city} labelClassName={FIELD_LABEL} />
      <Select label="State" name="state" value={form.state} onChange={set("state")} options={US_STATE_OPTIONS} placeholder="Select state" error={errors.state} labelClassName={FIELD_LABEL} />
      <Input label="Zip Code" name="zipCode" value={form.zipCode} onChange={set("zipCode")} placeholder="33301" error={errors.zipCode} labelClassName={FIELD_LABEL} />
      <Input label="Conference/Division" name="conference" value={form.conference} onChange={set("conference")} placeholder="Eastern Lakes Conference" icon={<MapPin className="w-5 h-5" />} error={errors.conference} labelClassName={FIELD_LABEL} />
    </div>
  );
}
