"use client";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { INPUT, OPTIONAL_HINT, SELECT, TEXTAREA } from "@/components/auth/sign-up-shared/styles";
import { SCHOOL_LEVEL_OPTIONS, isSchool, type StepProps } from "@/components/auth/organization-sign-up/data";
import { ORG_TYPE_OPTIONS } from "@/components/organization/org-form/form";

const HALF = "min-w-0 sm:col-span-3";

// Step 2: the organisation, its type and, for a school, its level.
export default function OrganizationStep({ form, errors, onField }: StepProps) {
  const school = isSchool(form.organizationType);
  return (
    <section aria-label="Organization" className="flex flex-col gap-5">
      <StepHeading title="Organization & team" description="Basic information about your organization." />

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
        {/* Only a school has a level. */}
        {school && (
          <Select
            label="LEVEL"
            name="org-level"
            value={form.level}
            onChange={onField("level")}
            options={SCHOOL_LEVEL_OPTIONS}
            placeholder="Choose a level…"
            error={errors.level}
            variant="dark"
            className={HALF}
            labelClassName={SECTION_LABEL}
            selectClassName={SELECT}
          />
        )}
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
