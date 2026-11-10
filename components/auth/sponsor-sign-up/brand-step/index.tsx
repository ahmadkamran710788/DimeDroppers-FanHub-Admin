"use client";

import { coordinateText } from "@/utils/helper";
import Input from "@/components/common/input";
import LocationPicker from "@/components/common/location-picker";
import Select from "@/components/common/select";
import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import SponsorTypePicker from "@/components/auth/sponsor-sign-up/sponsor-type-picker";
import type { MainLocationField, SponsorSignUpForm } from "@/components/auth/sponsor-sign-up/data";
import { INPUT, OPTIONAL_HINT, SELECT } from "@/components/auth/sign-up-shared/styles";
import type { SponsorSignupOptions, SponsorTypeCode } from "@/utils/types/sponsor-profile";

type FieldElement = HTMLInputElement | HTMLSelectElement;

interface BrandStepProps {
  form: SponsorSignUpForm;
  errors: Record<string, string>;
  onField: (field: keyof SponsorSignUpForm) => (e: React.ChangeEvent<FieldElement>) => void;
  options: SponsorSignupOptions;
  type: SponsorTypeCode;
  onType: (type: SponsorTypeCode) => void;
  // Several main location fields at once, from the map picker.
  onLocation: (fields: Partial<Pick<SponsorSignUpForm, MainLocationField>>) => void;
}

// Step 2: the brand organizations see when this sponsor sponsors them, and its main location.
export default function BrandStep({ form, errors, onField, options, type, onType, onLocation }: BrandStepProps) {
  return (
    <section aria-label="About your brand" className="flex flex-col gap-[22px]">
      <StepHeading
        title="About your brand"
        description="Organizations see this when you sponsor them. You can edit it later in your profile."
      />

      <SponsorTypePicker types={options.sponsorTypes} value={type} onChange={onType} />

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
        options={options.categories.map((c) => ({ label: c.label, value: c.code }))}
        placeholder="Choose a category"
        error={errors.category}
        variant="dark"
        labelClassName={SECTION_LABEL}
        selectClassName={SELECT}
      />

      {/* Where Fetch locations searches from (a local business: this city). */}
      <div className="flex flex-col gap-[14px] border-t border-[#1f1f1f] pt-[22px]">
        <div>
          <div className={SECTION_LABEL}>MAIN LOCATION</div>
          <p className="text-sm text-[#a8a8a8] mt-1">
            Your headquarters or main branch. We use it to find your other stores.
          </p>
        </div>
        <LocationPicker
          name="main-location"
          latitude={form.latitude}
          longitude={form.longitude}
          onPlace={(place) =>
            onLocation({
              street: place.street,
              city: place.city,
              state: place.state,
              zip: place.zip,
              latitude: coordinateText(place.latitude),
              longitude: coordinateText(place.longitude),
            })
          }
          onPin={(latitude, longitude) =>
            onLocation({ latitude: coordinateText(latitude), longitude: coordinateText(longitude) })
          }
          error={errors.latitude}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-[14px]">
          <Input
            label="STREET ADDRESS"
            name="main-street"
            value={form.street}
            onChange={onField("street")}
            placeholder="Street and number"
            autoComplete="address-line1"
            error={errors.street}
            variant="dark"
            className="col-span-full"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
          <Input
            label="CITY"
            name="main-city"
            value={form.city}
            onChange={onField("city")}
            autoComplete="address-level2"
            error={errors.city}
            variant="dark"
            className="min-w-0 sm:col-span-2"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
          <Select
            label="STATE"
            name="main-state"
            value={form.state}
            onChange={onField("state")}
            options={US_STATE_OPTIONS}
            placeholder="Choose"
            error={errors.state}
            variant="dark"
            className="min-w-0 sm:col-span-2"
            labelClassName={SECTION_LABEL}
            selectClassName={SELECT}
          />
          <Input
            label="ZIP CODE"
            labelHint={<span className={OPTIONAL_HINT}>· optional</span>}
            name="main-zip"
            value={form.zip}
            onChange={onField("zip")}
            autoComplete="postal-code"
            error={errors.zip}
            variant="dark"
            className="min-w-0 sm:col-span-2"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
          {/* Filled from the map; typed only when the map isn't available. */}
          <Input
            label="LATITUDE"
            name="main-latitude"
            value={form.latitude}
            onChange={onField("latitude")}
            placeholder="e.g. 30.3058"
            inputMode="decimal"
            variant="dark"
            className="min-w-0 sm:col-span-3"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
          <Input
            label="LONGITUDE"
            name="main-longitude"
            value={form.longitude}
            onChange={onField("longitude")}
            placeholder="e.g. -97.7516"
            inputMode="decimal"
            // A missing pin is said once, under the map.
            error={errors.latitude ? undefined : errors.longitude}
            variant="dark"
            className="min-w-0 sm:col-span-3"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
        </div>
      </div>
    </section>
  );
}
