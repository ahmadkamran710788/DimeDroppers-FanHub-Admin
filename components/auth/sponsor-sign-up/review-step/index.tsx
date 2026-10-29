"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import { CARD } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sponsor-sign-up/step-heading";
import LegalModal from "@/components/auth/sponsor-sign-up/legal-modal";
import type { PickedLogo } from "@/components/auth/sponsor-sign-up/logo-upload";
import type { SponsorSignUpForm } from "@/components/auth/sponsor-sign-up/data";
import type { LegalDocument, SponsorSignupOptions, SponsorTypeCode } from "@/utils/types/sponsor-profile";

const ROW = "flex flex-wrap gap-x-5 gap-y-2 items-center py-4";
const ROW_LABEL = "flex-[0_0_160px] text-[13px] font-semibold tracking-[1px] text-[#a8a8a8]";
const EDIT = "h-11 px-3 text-sm font-semibold text-[#c9b8ff] hover:text-white";
// A text button that reads as a link inside the agreement sentence.
const LINK = "inline text-[15px] font-normal text-[#c9b8ff] underline hover:text-white";

interface ReviewStepProps {
  form: SponsorSignUpForm;
  options: SponsorSignupOptions;
  type: SponsorTypeCode;
  logo: PickedLogo | null;
  terms: LegalDocument | null;
  privacy: LegalDocument | null;
  agree: boolean;
  onToggleAgree: () => void;
  // The API refused the agreement (it's normally ticked before Finish is enabled).
  agreeError?: string;
  // Jumps back to a step (1 = Account, 2 = Brand) to change it.
  onEdit: (step: number) => void;
}

// Step 3: everything entered so far, with Edit links back, and the terms to accept.
export default function ReviewStep({
  form,
  options,
  type,
  logo,
  terms,
  privacy,
  agree,
  onToggleAgree,
  agreeError,
  onEdit,
}: ReviewStepProps) {
  const [reading, setReading] = useState<"terms" | "privacy" | null>(null);
  const typeName = options.sponsorTypes.find((t) => t.code === type)?.label;
  const categoryName = options.categories.find((c) => c.code === form.category)?.label ?? form.category;

  return (
    <section aria-label="Review" className="flex flex-col gap-[18px]">
      <StepHeading title="Review and finish" description="Check everything looks right. You can change any of it later." />

      <div className={cn(CARD, "rounded-[14px] px-5 py-[6px]")}>
        <div className={cn(ROW, "border-b border-[#222]")}>
          <div className={ROW_LABEL}>ACCOUNT</div>
          <div className="flex-[1_1_220px] min-w-0 text-[15px] leading-[1.5] break-words">
            {form.contact}
            <br />
            <span className="text-[#bdbdbd]">{form.email}</span>
          </div>
          <Button variant="text" size="sm" label="Edit" aria-label="Edit account" onClick={() => onEdit(1)} className={EDIT} />
        </div>

        <div className={ROW}>
          <div className={ROW_LABEL}>BRAND</div>
          <div className="flex-[1_1_220px] min-w-0 flex gap-3 items-center">
            <div
              className={cn(
                "size-12 shrink-0 rounded-[10px] flex items-center justify-center overflow-hidden",
                logo ? "bg-[#1f1a33]" : "border-[1.5px] border-dashed border-[#555]"
              )}
            >
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={logo.url} alt="Your logo" className="max-w-full max-h-full object-contain p-1" />
              )}
            </div>
            <div className="min-w-0 text-[15px] leading-[1.5] break-words">
              {form.name}
              <br />
              <span className="text-[#bdbdbd]">
                {categoryName} · {typeName}
              </span>
            </div>
          </div>
          <Button variant="text" size="sm" label="Edit" aria-label="Edit brand" onClick={() => onEdit(2)} className={EDIT} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-px min-h-11 text-[15px] text-[#e0e0e0]">
          <Button
            id="sponsor-terms"
            size="icon"
            icon={<Checkbox variant="violet" checked={agree} />}
            role="checkbox"
            aria-checked={agree}
            aria-label="I agree to the Sponsor Terms and Privacy Policy"
            onClick={onToggleAgree}
            className="size-11 -ml-[11px] bg-transparent backdrop-blur-none"
          />
          {/* The words tick the box too; the two documents open in a modal. A label can't hold a button,
              so the sentence is split around them. */}
          <p>
            <label htmlFor="sponsor-terms" className="cursor-pointer">
              I agree to the{" "}
            </label>
            <Button variant="text" size="sm" label="Sponsor Terms" onClick={() => setReading("terms")} className={LINK} />
            <label htmlFor="sponsor-terms" className="cursor-pointer">
              {" "}
              and{" "}
            </label>
            <Button variant="text" size="sm" label="Privacy Policy" onClick={() => setReading("privacy")} className={LINK} />
          </p>
        </div>
        {agreeError && <p className="text-sm text-error">{agreeError}</p>}
      </div>

      <LegalModal doc={terms} label="Sponsor Terms" isOpen={reading === "terms"} onClose={() => setReading(null)} />
      <LegalModal
        doc={privacy}
        label="Privacy Policy"
        isOpen={reading === "privacy"}
        onClose={() => setReading(null)}
      />
    </section>
  );
}
