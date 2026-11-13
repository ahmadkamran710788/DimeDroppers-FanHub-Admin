"use client";

import { config } from "@/config";
import { coordinateText } from "@/utils/helper";
import Input from "@/components/common/input";
import LocationPicker from "@/components/common/location-picker";
import Select from "@/components/common/select";
import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import { CUSTOM_CATEGORY_MAX, OTHER_CATEGORY } from "@/components/sponsor/data";
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
  // Google's business type for a place picked on the map, null for a plain address.
  onBusinessType: (businessType: string | null) => void;
}

// Step 2: the brand organizations see when this sponsor sponsors them, and its main location.
export default function BrandStep({
  form,
  errors,
  onField,
  options,
  type,
  onType,
  onLocation,
  onBusinessType,
}: BrandStepProps) {
  // Google's business type for the main location first (unless it's already one of ours), then our
  // categories, then Other for one the sponsor types.
  const fromGoogle =
    form.googleCategory && !options.categories.some((c) => c.code === form.googleCategory)
      ? [{ label: `${form.googleCategory} · from Google`, value: form.googleCategory }]
      : [];
  const categoryOptions = [
    ...fromGoogle,
    ...options.categories.map((c) => ({ label: c.label, value: c.code })),
    { label: "Other", value: OTHER_CATEGORY },
  ];
  // Without a Maps key there's no search to fill it from.
  const categoryHint = !form.category
    ? config.googleMapsApiKey
      ? "Search for your business under Main location above and we’ll fill this in from Google."
      : ""
    : form.googleCategory && form.category === form.googleCategory
      ? "From your Google listing. You can choose a different category."
      : "";

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
          // The category from Google: the picked business's type, or the business's at a picked address.
          onBusinessType={onBusinessType}
          businessName={form.name}
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

      {/* After the main location, which usually fills it from Google. */}
      <div className="flex flex-col gap-[14px] border-t border-[#1f1f1f] pt-[22px]">
        <div className="flex flex-col gap-2">
          <Select
            label="SPONSOR CATEGORY"
            name="sponsor-category"
            value={form.category}
            onChange={onField("category")}
            options={categoryOptions}
            placeholder="Choose a category"
            error={errors.category}
            variant="dark"
            labelClassName={SECTION_LABEL}
            selectClassName={SELECT}
          />
          {!errors.category && categoryHint && <p className="text-sm text-[#a8a8a8]">{categoryHint}</p>}
        </div>
        {form.category === OTHER_CATEGORY && (
          <Input
            label="YOUR CATEGORY"
            name="sponsor-category-other"
            value={form.categoryOther}
            onChange={onField("categoryOther")}
            placeholder="e.g. Pizza restaurant"
            maxLength={CUSTOM_CATEGORY_MAX}
            error={errors.categoryOther}
            variant="dark"
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
        )}
      </div>
    </section>
  );
}
