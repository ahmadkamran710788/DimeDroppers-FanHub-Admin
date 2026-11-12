"use client";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { INPUT, OPTIONAL_HINT, SELECT, TEXTAREA } from "@/components/auth/sign-up-shared/styles";
import { DESCRIPTION_MAX, hasLevel, type StepProps } from "@/components/auth/organization-sign-up/data";
import type { OrgSignUpOptions } from "@/utils/types/auth";

const HALF = "min-w-0 sm:col-span-3";

interface OrganizationStepProps extends StepProps {
  // The types and levels (sign-up options).
  options: OrgSignUpOptions;
}

// Step 2: the organisation, its type and, for a type with a level (a school), its level.
export default function OrganizationStep({ form, errors, onField, onValue, options }: OrganizationStepProps) {
  const withLevel = hasLevel(options, form.organizationType);
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
          onChange={(e) => {
            onField("organizationType")(e);
            // A type without a level drops one picked before (the API refuses a level for it).
            if (!hasLevel(options, e.target.value)) onValue("level")("");
          }}
          options={options.organizationTypes.map((t) => ({ label: t.label, value: t.code }))}
          placeholder="Choose a type…"
          error={errors.organizationType}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        {withLevel && (
          <Select
            label="LEVEL"
            name="org-level"
            value={form.level}
            onChange={onField("level")}
            options={options.levels.map((l) => ({ label: l.label, value: l.code }))}
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
          maxLength={DESCRIPTION_MAX}
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
