"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { sponsorAccountSchema, sponsorBrandSchema } from "@/components/auth/schema";
import BrandPanel from "@/components/auth/sponsor-sign-up/brand-panel";
import SignUpSteps from "@/components/auth/sponsor-sign-up/sign-up-steps";
import AccountStep from "@/components/auth/sponsor-sign-up/account-step";
import BrandStep from "@/components/auth/sponsor-sign-up/brand-step";
import ReviewStep from "@/components/auth/sponsor-sign-up/review-step";
import DoneStep from "@/components/auth/sponsor-sign-up/done-step";
import type { PickedLogo } from "@/components/auth/sponsor-sign-up/logo-upload";
import {
  DONE_STEP,
  INITIAL_FORM,
  type SponsorSignUpForm,
  type SponsorType,
} from "@/components/auth/sponsor-sign-up/data";

const NAV_BUTTON = "h-[52px] rounded-[12px] text-base";

// Sponsor sign-up: Account → Brand → Review, then the "all set" screen. UI only for now: creating
// the account just shows that screen until the sponsor sign-up API is wired.
export default function SponsorSignUp() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SponsorSignUpForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState<SponsorType>("local");
  const [logo, setLogo] = useState<PickedLogo | null>(null);
  const [agree, setAgree] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  // The step whose heading last had focus, so the first render doesn't steal it.
  const shownStep = useRef(step);

  // A replaced or removed logo (and the last one on leaving the page) frees its preview URL.
  useEffect(() => {
    return () => {
      if (logo) URL.revokeObjectURL(logo.url);
    };
  }, [logo]);

  // Each new step starts at its heading.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    contentRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [step]);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setField =
    (field: keyof SponsorSignUpForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    };

  const setPhone = (value: string) => {
    setForm((prev) => ({ ...prev, phone: value }));
    clearError("phone");
  };

  const goTo = (next: number) => {
    setErrors({});
    setStep(next);
  };

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1 && !(await validateAndSetErrors(sponsorAccountSchema, form, setErrors))) return;
    if (step === 2 && !(await validateAndSetErrors(sponsorBrandSchema, form, setErrors))) return;
    if (step === 3 && !agree) return;
    goTo(step + 1);
  }

  function restart() {
    setForm(INITIAL_FORM);
    setType("local");
    setLogo(null);
    setAgree(false);
    goTo(1);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <BrandPanel />

      <main className="lg:flex-[1.3_1_520px] min-w-0 px-4 py-8 md:px-14 md:pt-12 md:pb-16 flex justify-center">
        <div ref={contentRef} className="w-full max-w-[640px] flex flex-col gap-7">
          {step === DONE_STEP ? (
            <DoneStep contact={form.contact} email={form.email} onRestart={restart} />
          ) : (
            <form onSubmit={handleNext} noValidate className="flex flex-col gap-7">
              <SignUpSteps current={step} />

              {step === 1 && <AccountStep form={form} errors={errors} onField={setField} onPhone={setPhone} />}
              {step === 2 && (
                <BrandStep
                  form={form}
                  errors={errors}
                  onField={setField}
                  type={type}
                  onType={setType}
                  logo={logo}
                  onPickLogo={(file) => setLogo({ file, url: URL.createObjectURL(file) })}
                  onRemoveLogo={() => setLogo(null)}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  form={form}
                  type={type}
                  logo={logo}
                  agree={agree}
                  onToggleAgree={() => setAgree((prev) => !prev)}
                  onEdit={goTo}
                />
              )}

              <div className="flex justify-between gap-3 flex-wrap border-t border-[#1f1f1f] pt-6">
                {step > 1 && (
                  <Button
                    label="Back"
                    onClick={() => goTo(step - 1)}
                    className={cn(OUTLINE_BUTTON, NAV_BUTTON, "px-[22px] font-semibold")}
                  />
                )}
                <Button
                  type="submit"
                  label={step === 3 ? "Create sponsor account" : "Continue"}
                  disabled={step === 3 && !agree}
                  className={cn(
                    PRIMARY_BUTTON,
                    NAV_BUTTON,
                    "ml-auto px-[26px] disabled:opacity-100 disabled:bg-[#3a3450] disabled:text-[#bdb6d6]"
                  )}
                />
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
