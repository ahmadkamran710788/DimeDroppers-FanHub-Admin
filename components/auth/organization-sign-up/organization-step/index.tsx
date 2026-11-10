"use client";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { GROUP_HEADING, INPUT, OPTIONAL_HINT, SELECT, TEXTAREA } from "@/components/auth/sign-up-shared/styles";
import GenderPicker from "@/components/auth/organization-sign-up/gender-picker";
import type { StepProps } from "@/components/auth/organization-sign-up/data";
import {
  EVENT_TYPE_OPTIONS,
  LEVEL_OPTIONS,
  ORG_TYPE_OPTIONS,
  SPORT_OPTIONS,
} from "@/components/organization/org-form/form";

const HALF = "min-w-0 sm:col-span-3";

// Step 2: the organisation, its team, sport and level. The lists are the Profile page's, so what's picked
// here shows there too.
export default function OrganizationStep({ form, errors, onField, onValue }: StepProps) {
  return (
    <section aria-label="Organization and team" className="flex flex-col gap-5">
      <StepHeading title="Organization & team" description="Basic information about your organization, sport and level." />

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-[18px] gap-y-[22px]">
        <Input
          label="ORGANIZATION NAME"
          name="org-name"
          value={form.organizationName}
          onChange={onField("organizationName")}
          placeholder="North Florida Hoop Group"
          autoComplete="organization"
          error={errors.organizationName}
          variant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Select
          label="ORGANIZATION TYPE"
          name="org-type"
          value={form.organizationType}
          onChange={onField("organizationType")}
          options={ORG_TYPE_OPTIONS}
          placeholder="Choose a type…"
          error={errors.organizationType}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        <Select
          label="EVENT TYPE"
          name="org-event-type"
          value={form.eventType}
          onChange={onField("eventType")}
          options={EVENT_TYPE_OPTIONS}
          placeholder="Choose an event type…"
          error={errors.eventType}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        <Input
          label="TEAM NAME"
          name="org-team-name"
          value={form.teamName}
          onChange={onField("teamName")}
          placeholder={form.organizationName.trim() || "North Florida Hoop Group"}
          hint="Leave empty to use your organization name."
          error={errors.teamName}
          variant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />

        <h3 className={GROUP_HEADING}>Sport & level</h3>

        <Select
          label="SPORT"
          name="org-sport"
          value={form.sport}
          onChange={onField("sport")}
          options={SPORT_OPTIONS}
          placeholder="Choose a sport…"
          error={errors.sport}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        <Select
          label="LEVEL"
          name="org-level"
          value={form.level}
          onChange={onField("level")}
          options={LEVEL_OPTIONS}
          placeholder="Choose a level…"
          error={errors.level}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        <GenderPicker value={form.gender} onChange={onValue("gender")} error={errors.gender} />
        <Textarea
          label={
            <>
              DESCRIPTION <span className={OPTIONAL_HINT}>· optional</span>
            </>
          }
          name="org-description"
          value={form.description}
          onChange={onField("description")}
          placeholder="e.g. The official fan hub for North Florida Hoop Group, with schedules, team info and updates for our tournaments."
          maxLength={250}
          rows={3}
          counterInLabel
          error={errors.description}
          fieldVariant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          fieldClassName={TEXTAREA}
        />
      </div>
    </section>
  );
}
