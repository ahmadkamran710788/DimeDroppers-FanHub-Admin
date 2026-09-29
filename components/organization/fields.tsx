"use client";

import { MapPin } from "lucide-react";
import ColorPicker from "@/components/common/color-picker";
import FileUpload from "@/components/common/file-upload";
import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import {
  EVENT_TYPE_OPTIONS,
  LEVEL_OPTIONS,
  ORG_TYPE_OPTIONS,
  SPORT_OPTIONS,
  US_STATE_OPTIONS,
  type OrgFormState,
} from "@/components/organization/form";

// Field groups of the organization profile form. Each group renders on a dark surface and
// is reused by the Setup Wizard step (inside its section cards) and the Profile edit dialogs.

export interface FieldGroupProps {
  form: OrgFormState;
  errors: Record<string, string>;
  set: (field: keyof OrgFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setValue: (field: keyof OrgFormState) => (value: string) => void;
}

const L = "text-white";
const GRID = "grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6";

export function OrgTeamFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={GRID}>
      <Input label="Organization Name" name="organizationName" value={form.organizationName} onChange={set("organizationName")} placeholder="Twin Lakes Academy Middle School" error={errors.organizationName} className="sm:col-span-2" labelClassName={L} />
      <Select label="Organization Type" name="organizationType" value={form.organizationType} onChange={set("organizationType")} options={ORG_TYPE_OPTIONS} placeholder="Select organization type" error={errors.organizationType} labelClassName={L} />
      <Select label="Event Type" name="eventType" value={form.eventType} onChange={set("eventType")} options={EVENT_TYPE_OPTIONS} placeholder="Select event type" error={errors.eventType} labelClassName={L} />
      <Input label="Team Name" name="teamName" value={form.teamName} onChange={set("teamName")} placeholder="TLAM" error={errors.teamName} className="sm:col-span-2" labelClassName={L} />
    </div>
  );
}

export function SportLevelFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={GRID}>
      <Select label="Sport" name="sport" value={form.sport} onChange={set("sport")} options={SPORT_OPTIONS} placeholder="Select sport" error={errors.sport} labelClassName={L} />
      <Select label="Level" name="level" value={form.level} onChange={set("level")} options={LEVEL_OPTIONS} placeholder="Select level" error={errors.level} labelClassName={L} />
    </div>
  );
}

export function LocationFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className={GRID}>
      <Input label="Street Address" name="streetAddress" value={form.streetAddress} onChange={set("streetAddress")} placeholder="1234 Lakeview Dr" icon={<MapPin className="w-5 h-5" />} error={errors.streetAddress} className="sm:col-span-2" labelClassName={L} />
      <Input label="City" name="city" value={form.city} onChange={set("city")} placeholder="Fort Lauderdale" error={errors.city} labelClassName={L} />
      <Select label="State" name="state" value={form.state} onChange={set("state")} options={US_STATE_OPTIONS} placeholder="Select state" error={errors.state} labelClassName={L} />
      <Input label="Zip Code" name="zipCode" value={form.zipCode} onChange={set("zipCode")} placeholder="33301" error={errors.zipCode} labelClassName={L} />
      <Input label="Conference/Division" name="conference" value={form.conference} onChange={set("conference")} placeholder="Eastern Lakes Conference" icon={<MapPin className="w-5 h-5" />} error={errors.conference} labelClassName={L} />
    </div>
  );
}

export function DescriptionField({ form, errors, set }: FieldGroupProps) {
  return (
    <Textarea label="Description" name="description" value={form.description} onChange={set("description")} maxLength={250} placeholder="The Official fan hub for your team..." error={errors.description} />
  );
}

export function ContactFields({ form, errors, set, setValue }: FieldGroupProps) {
  return (
    <div className={GRID}>
      <Input label="Contact Name" name="contactName" value={form.contactName} onChange={set("contactName")} placeholder="John Doe" error={errors.contactName} labelClassName={L} />
      <Input label="Position" name="contactPosition" value={form.contactPosition} onChange={set("contactPosition")} placeholder="Athletic Director" error={errors.contactPosition} labelClassName={L} />
      <PhoneInput label="Phone" name="phone" value={form.phone} onValueChange={setValue("phone")} placeholder="(555) 123-4567" error={errors.phone} />
      <Input label="Email" name="email" value={form.email} onChange={set("email")} placeholder="johndoe@tlam.com" type="email" error={errors.email} labelClassName={L} />
      <Input label="Website" name="website" value={form.website} onChange={set("website")} placeholder="https://www.tlam.com" type="url" error={errors.website} labelClassName={L} />
    </div>
  );
}

// Social networks, with their icon per row.
export const SOCIAL_FIELDS = [
  { field: "facebookUrl", label: "Facebook", icon: "/icons/step1/fb.svg" },
  { field: "instagramUrl", label: "Instagram", icon: "/icons/step1/insta.svg" },
  { field: "xUrl", label: "X (Former Twitter)", icon: "/icons/step1/x.svg" },
  { field: "youtubeUrl", label: "Youtube", icon: "/icons/step1/yt.svg" },
  { field: "tiktokUrl", label: "TikTok", icon: "/icons/step1/tiktok.svg" },
] as const;

export function SocialFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className="flex flex-col gap-6">
      {SOCIAL_FIELDS.map(({ field, label, icon }) => (
        <Input
          key={field}
          label={label}
          name={field}
          value={form[field]}
          onChange={set(field)}
          placeholder="https://"
          type="url"
          error={errors[field]}
          // eslint-disable-next-line @next/next/no-img-element
          icon={<img src={icon} alt="" className="w-6 h-6" />}
          labelClassName={L}
        />
      ))}
    </div>
  );
}

interface BrandingFieldsProps extends FieldGroupProps {
  existingLogoUrl?: string;
  onLogo: (file: File | null, url: string | null) => void;
}

export function BrandingFields({ form, setValue, existingLogoUrl, onLogo }: BrandingFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ColorPicker label="Primary Color" name="primaryColor" value={form.primaryColor} onChange={setValue("primaryColor")} />
        <ColorPicker label="Secondary Color" name="secondaryColor" value={form.secondaryColor} onChange={setValue("secondaryColor")} />
        <ColorPicker label="Accent Color" name="accentColor" value={form.accentColor} onChange={setValue("accentColor")} />
      </div>
      <FileUpload
        label="Team Logo"
        variant="image"
        existingUrl={existingLogoUrl}
        onFile={(file, url) => onLogo(file, url ?? null)}
        onClear={() => onLogo(null, null)}
      />
    </div>
  );
}
