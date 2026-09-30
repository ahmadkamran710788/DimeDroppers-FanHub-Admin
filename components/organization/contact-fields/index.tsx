"use client";

import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import {
  FIELD_GRID,
  FIELD_LABEL,
  type FieldGroupProps,
} from "@/components/organization/form";

export default function ContactFields({ form, errors, set, setValue }: FieldGroupProps) {
  return (
    <div className={FIELD_GRID}>
      <Input label="Contact Name" name="contactName" value={form.contactName} onChange={set("contactName")} placeholder="John Doe" error={errors.contactName} labelClassName={FIELD_LABEL} />
      <Input label="Position" name="contactPosition" value={form.contactPosition} onChange={set("contactPosition")} placeholder="Athletic Director" error={errors.contactPosition} labelClassName={FIELD_LABEL} />
      <PhoneInput label="Phone" name="phone" value={form.phone} onValueChange={setValue("phone")} placeholder="(555) 123-4567" error={errors.phone} />
      <Input label="Email" name="email" value={form.email} onChange={set("email")} placeholder="johndoe@tlam.com" type="email" error={errors.email} labelClassName={FIELD_LABEL} />
      <Input label="Website" name="website" value={form.website} onChange={set("website")} placeholder="https://www.tlam.com" type="url" error={errors.website} labelClassName={FIELD_LABEL} />
    </div>
  );
}
