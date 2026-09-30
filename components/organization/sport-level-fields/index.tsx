"use client";

import Select from "@/components/common/select";
import {
  LEVEL_OPTIONS,
  SPORT_OPTIONS,
  FIELD_GRID,
  FIELD_LABEL,
  type FieldGroupProps,
} from "@/components/organization/form";

export default function SportLevelFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={FIELD_GRID}>
      <Select label="Sport" name="sport" value={form.sport} onChange={set("sport")} options={SPORT_OPTIONS} placeholder="Select sport" error={errors.sport} labelClassName={FIELD_LABEL} />
      <Select label="Level" name="level" value={form.level} onChange={set("level")} options={LEVEL_OPTIONS} placeholder="Select level" error={errors.level} labelClassName={FIELD_LABEL} />
    </div>
  );
}
