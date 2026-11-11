"use client";

import { cn } from "@/utils/cn";
import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { INPUT, OPTIONAL_HINT } from "@/components/auth/sign-up-shared/styles";
import type { StepProps } from "@/components/auth/organization-sign-up/data";

// Step 1: the person who manages the organisation's Fan Hub. Their name, email and phone also fill the
// contact on step 3 (they can change it there).
export default function AccountStep({ form, errors, onField, onValue }: StepProps) {
  return (
    <section aria-label="Create your account" className="flex flex-col gap-5">
      <StepHeading title="Create your account" description="The person who manages your organization’s Fan Hub." />

      <Input
        label="YOUR FULL NAME"
        name="org-full-name"
        value={form.fullName}
        onChange={onField("fullName")}
        placeholder="Jordan Ellis"
        autoComplete="name"
        error={errors.fullName}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Input
        label="EMAIL"
        name="org-email"
        type="email"
        value={form.accountEmail}
        onChange={onField("accountEmail")}
        placeholder="you@yourorganization.com"
        autoComplete="email"
        error={errors.accountEmail}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Input
        label="PASSWORD"
        name="org-password"
        type="password"
        value={form.password}
        onChange={onField("password")}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        hint="Use 8 or more characters with a number."
        error={errors.password}
        variant="dark"
        labelClassName={SECTION_LABEL}
        // Room for the show/hide eye on the right.
        inputClassName={cn(INPUT, "pr-11")}
      />
      <PhoneInput
        label={
          <>
            PHONE <span className={OPTIONAL_HINT}>· optional</span>
          </>
        }
        name="org-phone"
        value={form.accountPhone}
        onValueChange={onValue("accountPhone")}
        placeholder="(555) 000-0000"
        error={errors.accountPhone}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
    </section>
  );
}
