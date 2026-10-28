"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import { CARD } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sponsor-sign-up/step-heading";
import type { PickedLogo } from "@/components/auth/sponsor-sign-up/logo-upload";
import { SPONSOR_TYPES, type SponsorSignUpForm, type SponsorType } from "@/components/auth/sponsor-sign-up/data";

const ROW = "flex flex-wrap gap-x-5 gap-y-2 items-center py-4";
const ROW_LABEL = "flex-[0_0_160px] text-[13px] font-semibold tracking-[1px] text-[#a8a8a8]";
const EDIT = "h-11 px-3 text-sm font-semibold text-[#c9b8ff] hover:text-white";
const LINK = "text-[#c9b8ff] underline hover:text-white";

interface ReviewStepProps {
  form: SponsorSignUpForm;
  type: SponsorType;
  logo: PickedLogo | null;
  agree: boolean;
  onToggleAgree: () => void;
  // Jumps back to a step (1 = Account, 2 = Brand) to change it.
  onEdit: (step: number) => void;
}

// Step 3: everything entered so far, with Edit links back, and the terms to accept.
export default function ReviewStep({ form, type, logo, agree, onToggleAgree, onEdit }: ReviewStepProps) {
  const typeName = SPONSOR_TYPES.find((t) => t.value === type)?.name;

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
                {form.category} · {typeName}
              </span>
            </div>
          </div>
          <Button variant="text" size="sm" label="Edit" aria-label="Edit brand" onClick={() => onEdit(2)} className={EDIT} />
        </div>
      </div>

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
        {/* Clicking the sentence ticks the box too; the links inside still open. */}
        <label htmlFor="sponsor-terms" className="cursor-pointer">
          I agree to the{" "}
          <Link href="#" className={LINK}>
            Sponsor Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className={LINK}>
            Privacy Policy
          </Link>
        </label>
      </div>
    </section>
  );
}
