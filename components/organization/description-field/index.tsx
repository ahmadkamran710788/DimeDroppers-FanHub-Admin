"use client";

import Textarea from "@/components/common/textarea";
import type { FieldGroupProps } from "@/components/organization/form";

export default function DescriptionField({ form, errors, set }: FieldGroupProps) {
  return (
    <Textarea label="Description" name="description" value={form.description} onChange={set("description")} maxLength={250} placeholder="The Official fan hub for your team..." error={errors.description} />
  );
}
