"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import LegalModal from "@/components/auth/sign-up-shared/legal-modal";
import { isSchool, type OrgSignUpForm } from "@/components/auth/organization-sign-up/data";
import {
  ORG_TYPE_OPTIONS,
  US_STATE_OPTIONS,
  labelOf,
} from "@/components/organization/org-form/form";
import type { LegalDocument } from "@/utils/types/sponsor-profile";

// A text button that reads as a link inside the agreement sentence.
const LINK = "inline text-[15px] font-normal text-[#c9b8ff] underline hover:text-white";

interface Group {
  title: string;
  // The step to go back to with Edit; none when it can't be changed any more.
  step?: number;
  rows: { label: string; value: ReactNode }[];
}

// A colour with its swatch.
const swatch = (hex: string) => (
  <span className="inline-flex items-center gap-2">
    <span className="size-4 rounded-[4px] border border-white/20" style={{ backgroundColor: hex }} />
    {hex.toUpperCase()}
  </span>
);

interface ReviewStepProps {
  form: OrgSignUpForm;
  logoName: string | null;
  // The account already exists (only the organisation details are left to save), so it can't be edited.
  accountCreated: boolean;
  terms: LegalDocument | null;
  privacy: LegalDocument | null;
  agree: boolean;
  onToggleAgree: () => void;
  agreeError?: string;
  onEdit: (step: number) => void;
}

// Step 5: everything entered so far, grouped as on the steps, each group with an Edit link back; then the
// terms to accept.
export default function ReviewStep({
  form,
  logoName,
  accountCreated,
  terms,
  privacy,
  agree,
  onToggleAgree,
  agreeError,
  onEdit,
}: ReviewStepProps) {
  const [reading, setReading] = useState<"terms" | "privacy" | null>(null);

  const groups: Group[] = [
    {
      title: "Account",
      step: accountCreated ? undefined : 1,
      rows: [
        { label: "Your full name", value: form.fullName },
        { label: "Email", value: form.accountEmail },
        { label: "Password", value: "•".repeat(Math.min(form.password.length, 12)) },
        { label: "Phone", value: form.accountPhone },
      ],
    },
    {
      title: "Organization & team",
      step: 2,
      rows: [
        { label: "Organization name", value: form.organizationName },
        { label: "Organization type", value: form.organizationType && labelOf(ORG_TYPE_OPTIONS, form.organizationType) },
        // Only a school has a level.
        ...(isSchool(form.organizationType) ? [{ label: "Level", value: form.level }] : []),
        { label: "Description", value: form.description },
      ],
    },
    {
      title: "Location",
      step: 3,
      rows: [
        { label: "Street address", value: form.streetAddress },
        { label: "City", value: form.city },
        { label: "State", value: form.state && labelOf(US_STATE_OPTIONS, form.state) },
        { label: "Zip code", value: form.zipCode },
        { label: "Map pin", value: form.latitude && `${form.latitude}, ${form.longitude}` },
        { label: "Conference / division", value: form.conference },
      ],
    },
    {
      title: "Contact information",
      step: 3,
      rows: [
        { label: "Contact name", value: form.contactName },
        { label: "Position", value: form.contactPosition },
        { label: "Phone", value: form.phone },
        { label: "Email", value: form.email },
        { label: "Website", value: form.website },
      ],
    },
    {
      title: "Branding",
      step: 4,
      rows: [
        { label: "Team logo", value: logoName ?? "No logo uploaded" },
        { label: "Primary color", value: swatch(form.primaryColor) },
        { label: "Secondary color", value: swatch(form.secondaryColor) },
        { label: "Accent color", value: swatch(form.accentColor) },
      ],
    },
    {
      title: "Social networks",
      step: 4,
      rows: [
        { label: "Facebook", value: form.facebookUrl },
        { label: "Instagram", value: form.instagramUrl },
        { label: "X", value: form.xUrl },
        { label: "YouTube", value: form.youtubeUrl },
        { label: "TikTok", value: form.tiktokUrl },
      ],
    },
  ];

  return (
    <section aria-label="Review" className="flex flex-col gap-4">
      <StepHeading title="Review and create" description="Check your details. You can edit all of this later in your profile." />

      {groups.map((group) => (
        <section
          key={group.title}
          aria-label={group.title}
          className="flex flex-col gap-3 rounded-[14px] border border-[#222228] bg-[#0b0b0d] px-5 py-[18px]"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-black uppercase text-[22px] leading-none">{group.title}</h3>
            {group.step && (
              <Button
                label="Edit"
                aria-label={`Edit ${group.title.toLowerCase()}`}
                onClick={() => onEdit(group.step as number)}
                className="h-[38px] px-[14px] rounded-[8px] border border-[#4f46e5] bg-[#13122b] text-[#e0e7ff] text-sm font-medium backdrop-blur-none hover:bg-[#1d1b40]"
              />
            )}
          </div>
          <dl className="grid grid-cols-[minmax(110px,200px)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            {group.rows.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-[#a1a1aa]">{row.label}</dt>
                <dd className="m-0 text-white break-words">{row.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-px min-h-11 text-[15px] text-[#e0e0e0]">
          <Button
            id="org-terms"
            size="icon"
            icon={<Checkbox variant="violet" checked={agree} />}
            role="checkbox"
            aria-checked={agree}
            aria-label="I agree to the Dime Fan Hub Terms of Service and Privacy Policy"
            onClick={onToggleAgree}
            className="size-11 -ml-[11px] bg-transparent backdrop-blur-none"
          />
          {/* The words tick the box too; the two documents open in a modal. A label can't hold a button, so
              the sentence is split around them. */}
          <p>
            <label htmlFor="org-terms" className="cursor-pointer">
              I agree to the Dime Fan Hub{" "}
            </label>
            <Button variant="text" size="sm" label="Terms of Service" onClick={() => setReading("terms")} className={LINK} />
            <label htmlFor="org-terms" className="cursor-pointer">
              {" "}
              and{" "}
            </label>
            <Button variant="text" size="sm" label="Privacy Policy" onClick={() => setReading("privacy")} className={LINK} />
            .
          </p>
        </div>
        {agreeError && <p className="text-sm text-error">{agreeError}</p>}
      </div>

      <LegalModal doc={terms} label="Terms of Service" isOpen={reading === "terms"} onClose={() => setReading(null)} />
      <LegalModal doc={privacy} label="Privacy Policy" isOpen={reading === "privacy"} onClose={() => setReading(null)} />
    </section>
  );
}
