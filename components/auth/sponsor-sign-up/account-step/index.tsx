"use client";

import { cn } from "@/utils/cn";
import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sponsor-sign-up/step-heading";
import type { SponsorSignUpForm } from "@/components/auth/sponsor-sign-up/data";
import { INPUT, OPTIONAL_HINT } from "@/components/auth/sponsor-sign-up/styles";

interface AccountStepProps {
  form: SponsorSignUpForm;
  errors: Record<string, string>;
  onField: (field: keyof SponsorSignUpForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhone: (value: string) => void;
  // From the sponsor options, e.g. "Use 8 or more characters with a number".
  passwordRule: string;
}

// Step 1: the person who manages sponsorships for the brand.
export default function AccountStep({ form, errors, onField, onPhone, passwordRule }: AccountStepProps) {
  return (
    <section aria-label="Create your account" className="flex flex-col gap-5">
      <StepHeading title="Create your account" description="The person who manages sponsorships for your brand." />

      <Input
        label="YOUR FULL NAME"
        name="sponsor-contact"
        value={form.contact}
        onChange={onField("contact")}
        placeholder="Jordan Ellis"
        autoComplete="name"
        error={errors.contact}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Input
        label="WORK EMAIL"
        name="sponsor-email"
        type="email"
        value={form.email}
        onChange={onField("email")}
        placeholder="you@yourbrand.com"
        autoComplete="email"
        error={errors.email}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Input
        label="PASSWORD"
        name="sponsor-password"
        type="password"
        value={form.password}
        onChange={onField("password")}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        hint={`${passwordRule}.`}
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
        name="sponsor-phone"
        value={form.phone}
        onValueChange={onPhone}
        placeholder="(555) 000-0000"
        error={errors.phone}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
    </section>
  );
}
