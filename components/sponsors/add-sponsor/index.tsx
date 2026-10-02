"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import WizardFooter from "@/components/common/wizard-footer";
import { addSponsorSchema, COUNTRY_OPTIONS, INDUSTRY_OPTIONS } from "@/components/sponsors/add-sponsor/schema";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL_FORM = {
  name: "",
  industry: "",
  address1: "",
  address2: "",
  country: "United States",
  city: "",
  state: "",
  zip: "",
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  website: "",
};
type Form = typeof INITIAL_FORM;

const LABEL = "text-white";
// Design fields are white with a 2px hairline border.
const FIELD = "bg-white border-2 border-[rgba(11,28,45,0.11)]";

export default function AddSponsorPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    update(key, e.target.value);

  const handleSave = async () => {
    if (!(await validateAndSetErrors(addSponsorSchema, form, setErrors))) return;
    // No sponsors endpoint yet — wire the create call here once the backend exposes it.
    toast("Saving sponsors is coming soon.");
  };

  const field = (key: keyof Form, label: string, placeholder: string, required = false) => (
    <Input
      label={label}
      name={key}
      value={form[key]}
      onChange={set(key)}
      placeholder={placeholder}
      required={required}
      error={errors[key]}
      labelClassName={LABEL}
      inputClassName={FIELD}
    />
  );

  return (
    <div className="flex flex-col gap-10 pb-24">
      <Link
        href={routes.ui.sponsors}
        className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
      >
        <ArrowLeft className="size-6" strokeWidth={1.5} />
        Back to Sponsors
      </Link>

      <div className="flex flex-col text-white max-w-[639px]">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Add Sponsor
        </h2>
        <p className="text-base leading-[26px]">
          Provide basic information so the Dime Sponsor AI Agent can build a complete sponsor profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,639fr)_minmax(0,445fr)] gap-6 lg:gap-10 items-start">
        <div className="flex flex-col gap-10">
          <SectionCard title="Sponsor Information" className="lg:p-6">
            {field("name", "Sponsor / Company Name", "Nike", true)}
            <Select
              label="Business Type / Industry"
              name="industry"
              value={form.industry}
              onChange={set("industry")}
              options={INDUSTRY_OPTIONS}
              placeholder="Please Select"
              required
              error={errors.industry}
              labelClassName={LABEL}
              selectClassName={FIELD}
            />
          </SectionCard>

          <SectionCard title="Address" className="lg:p-6">
            {field("address1", "Address 1", "756 Rose Blvd")}
            {field("address2", "Address 2", "BUILDING C")}
            <Select
              label="Country"
              name="country"
              value={form.country}
              onChange={set("country")}
              options={COUNTRY_OPTIONS}
              error={errors.country}
              labelClassName={LABEL}
              selectClassName={FIELD}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {field("city", "City", "Jacksonville")}
              {field("state", "State", "FL")}
              {field("zip", "ZIP", "67890")}
            </div>
          </SectionCard>

          <SectionCard title="Contact Information" className="lg:p-6">
            {field("contactName", "Primary Contact Name", "John Doe")}
            {field("jobTitle", "Job Title", "Enter job title")}
            {field("email", "Email Address", "johndoe@nike.com")}
            <PhoneInput
              label="Phone Number"
              name="phone"
              value={form.phone}
              onValueChange={(v) => update("phone", v)}
              error={errors.phone}
            />
            {field("website", "Website (Optional)", "https://www.nike.com")}
          </SectionCard>
        </div>

        <SectionCard className="lg:p-6">
          <div className="flex items-start gap-2 text-white">
            <Info className="size-10 shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col gap-2 leading-6">
              <h3 className="text-2xl font-bold">What Happens Next?</h3>
              <p className="text-base">
                The Dime Sponsor AI Agent will use this information to research the company, build a detailed profile,
                and identify the best sponsorship opportunities for your school.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <WizardFooter
        onBack={() => router.push(routes.ui.sponsors)}
        backLabel="Cancel"
        primaryLabel="Save Sponsor"
        onPrimary={handleSave}
      />
    </div>
  );
}
