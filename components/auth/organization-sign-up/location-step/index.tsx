"use client";

import { coordinateText } from "@/utils/helper";
import Input from "@/components/common/input";
import LocationPicker from "@/components/common/location-picker";
import PhoneInput from "@/components/common/phone-input";
import Select from "@/components/common/select";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { GROUP_HEADING, INPUT, OPTIONAL_HINT, SELECT } from "@/components/auth/sign-up-shared/styles";
import type { MapField, OrgSignUpForm, StepProps } from "@/components/auth/organization-sign-up/data";
import type { OrgSignUpOptions } from "@/utils/types/auth";

const HALF = "min-w-0 sm:col-span-3";
const THIRD = "min-w-0 sm:col-span-2";
const optional = <span className={OPTIONAL_HINT}>· optional</span>;

interface LocationStepProps extends StepProps {
  // Several location fields at once, from the map: a picked address fills them all, a moved pin only the pin.
  onLocation: (fields: Partial<Pick<OrgSignUpForm, MapField>>) => void;
  // US states (sign-up options); the map gives the same two-letter codes.
  states: OrgSignUpOptions["states"];
}

// Step 3: where the games happen (found on the map, which fills the address and the pin, as on the sponsor
// sign-up and profile) and who fans and sponsors can reach. The contact starts as the person from step 1.
export default function LocationStep({ form, errors, onField, onValue, onLocation, states }: LocationStepProps) {
  return (
    <section aria-label="Location and contact" className="flex flex-col gap-5">
      <StepHeading
        title="Location & contact"
        description="Where your games happen and who fans and sponsors can reach."
      />

      <div className="flex flex-col gap-[14px]">
        <div>
          <div className={SECTION_LABEL}>FIND YOUR LOCATION</div>
          <p className="text-sm text-[#a8a8a8] mt-1">
            Search for your address or drop the pin on the map. The address below fills in from it, and sponsors
            nearby find you by it.
          </p>
        </div>
        <LocationPicker
          name="org-location"
          latitude={form.latitude}
          longitude={form.longitude}
          onPlace={(place) =>
            onLocation({
              streetAddress: place.street,
              city: place.city,
              state: place.state,
              zipCode: place.zip,
              latitude: coordinateText(place.latitude),
              longitude: coordinateText(place.longitude),
            })
          }
          onPin={(latitude, longitude) =>
            onLocation({ latitude: coordinateText(latitude), longitude: coordinateText(longitude) })
          }
          error={errors.latitude}
          // "Search address" in capitals, like the other labels.
          labelClassName={`${SECTION_LABEL} uppercase`}
          inputClassName={INPUT}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-[18px] gap-y-[22px]">
        <Input
          label="STREET ADDRESS"
          name="org-street"
          value={form.streetAddress}
          onChange={onField("streetAddress")}
          placeholder="400 S Orange Ave"
          autoComplete="street-address"
          error={errors.streetAddress}
          variant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="CITY"
          name="org-city"
          value={form.city}
          onChange={onField("city")}
          placeholder="Jacksonville"
          autoComplete="address-level2"
          error={errors.city}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Select
          label="STATE"
          name="org-state"
          value={form.state}
          onChange={onField("state")}
          options={states.map((s) => ({ label: s.label, value: s.code }))}
          placeholder="Choose…"
          error={errors.state}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
          selectClassName={SELECT}
        />
        <Input
          label="ZIP CODE"
          name="org-zip"
          value={form.zipCode}
          onChange={onField("zipCode")}
          placeholder="32801"
          autoComplete="postal-code"
          inputMode="numeric"
          error={errors.zipCode}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        {/* Filled from the map; typed only when the map isn't available. */}
        <Input
          label="LATITUDE"
          name="org-latitude"
          value={form.latitude}
          onChange={onField("latitude")}
          placeholder="e.g. 28.538336"
          inputMode="decimal"
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="LONGITUDE"
          name="org-longitude"
          value={form.longitude}
          onChange={onField("longitude")}
          placeholder="e.g. -81.379234"
          inputMode="decimal"
          // A missing pin is said once, under the map.
          error={errors.latitude ? undefined : errors.longitude}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="CONFERENCE / DIVISION"
          labelHint={optional}
          name="org-conference"
          value={form.conference}
          onChange={onField("conference")}
          placeholder="e.g. East Bay"
          error={errors.conference}
          variant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />

        <h3 className={GROUP_HEADING}>Contact information</h3>

        <Input
          label="CONTACT NAME"
          name="org-contact-name"
          value={form.contactName}
          onChange={onField("contactName")}
          placeholder="Jason"
          autoComplete="name"
          error={errors.contactName}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="POSITION"
          name="org-contact-position"
          value={form.contactPosition}
          onChange={onField("contactPosition")}
          placeholder="Director"
          autoComplete="organization-title"
          error={errors.contactPosition}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <PhoneInput
          label="PHONE"
          name="org-contact-phone"
          value={form.contactPhone}
          onValueChange={onValue("contactPhone")}
          placeholder="(418) 543-8090"
          error={errors.contactPhone}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="EMAIL"
          name="org-contact-email"
          type="email"
          value={form.contactEmail}
          onChange={onField("contactEmail")}
          placeholder="contact@yourorganization.com"
          autoComplete="email"
          error={errors.contactEmail}
          variant="dark"
          className={HALF}
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Input
          label="WEBSITE"
          labelHint={optional}
          name="org-website"
          type="url"
          value={form.website}
          onChange={onField("website")}
          placeholder="https://www.yourorganization.com"
          autoComplete="url"
          error={errors.website}
          variant="dark"
          className="col-span-full"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
      </div>
    </section>
  );
}
