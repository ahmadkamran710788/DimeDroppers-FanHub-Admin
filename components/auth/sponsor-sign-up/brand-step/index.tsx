"use client";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sponsor-sign-up/step-heading";
import SponsorTypePicker from "@/components/auth/sponsor-sign-up/sponsor-type-picker";
import LogoUpload, { type PickedLogo } from "@/components/auth/sponsor-sign-up/logo-upload";
import { SPONSOR_CATEGORY_OPTIONS } from "@/components/sponsor/data";
import type { SponsorSignUpForm, SponsorType } from "@/components/auth/sponsor-sign-up/data";
import { INPUT, SELECT } from "@/components/auth/sponsor-sign-up/styles";

type FieldElement = HTMLInputElement | HTMLSelectElement;

interface BrandStepProps {
  form: SponsorSignUpForm;
  errors: Record<string, string>;
  onField: (field: keyof SponsorSignUpForm) => (e: React.ChangeEvent<FieldElement>) => void;
  type: SponsorType;
  onType: (type: SponsorType) => void;
  logo: PickedLogo | null;
  onPickLogo: (file: File) => void;
  onRemoveLogo: () => void;
}

// Step 2: the brand organizations see when this sponsor sponsors them.
export default function BrandStep({
  form,
  errors,
  onField,
  type,
  onType,
  logo,
  onPickLogo,
  onRemoveLogo,
}: BrandStepProps) {
  return (
    <section aria-label="About your brand" className="flex flex-col gap-[22px]">
      <StepHeading
        title="About your brand"
        description="Organizations see this when you sponsor them. You can edit it later in your profile."
      />

      <SponsorTypePicker value={type} onChange={onType} />

      <Input
        label="SPONSOR NAME"
        name="sponsor-name"
        value={form.name}
        onChange={onField("name")}
        placeholder="Your brand or business name"
        autoComplete="organization"
        error={errors.name}
        variant="dark"
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Select
        label="SPONSOR CATEGORY"
        name="sponsor-category"
        value={form.category}
        onChange={onField("category")}
        options={SPONSOR_CATEGORY_OPTIONS}
        placeholder="Choose a category"
        error={errors.category}
        variant="dark"
        labelClassName={SECTION_LABEL}
        selectClassName={SELECT}
      />

      <LogoUpload logo={logo} onPick={onPickLogo} onRemove={onRemoveLogo} />
    </section>
  );
}
