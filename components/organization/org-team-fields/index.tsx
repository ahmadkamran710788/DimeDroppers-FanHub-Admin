"use client";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import {
  EVENT_TYPE_OPTIONS,
  ORG_TYPE_OPTIONS,
  FIELD_GRID,
  FIELD_LABEL,
  type FieldGroupProps,
} from "@/components/organization/form";

export default function OrgTeamFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={FIELD_GRID}>
      <Input label="Organization Name" name="organizationName" value={form.organizationName} onChange={set("organizationName")} placeholder="Twin Lakes Academy Middle School" error={errors.organizationName} className="sm:col-span-2" labelClassName={FIELD_LABEL} />
      <Select label="Organization Type" name="organizationType" value={form.organizationType} onChange={set("organizationType")} options={ORG_TYPE_OPTIONS} placeholder="Select organization type" error={errors.organizationType} labelClassName={FIELD_LABEL} />
      <Select label="Event Type" name="eventType" value={form.eventType} onChange={set("eventType")} options={EVENT_TYPE_OPTIONS} placeholder="Select event type" error={errors.eventType} labelClassName={FIELD_LABEL} />
      <Input label="Team Name" name="teamName" value={form.teamName} onChange={set("teamName")} placeholder="TLAM" error={errors.teamName} className="sm:col-span-2" labelClassName={FIELD_LABEL} />
    </div>
  );
}
