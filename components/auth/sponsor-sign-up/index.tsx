"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { toE164Phone } from "@/utils/helper";
import { setSponsorAccount } from "@/utils/auth/session";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import { checkLogo } from "@/components/sponsor/data";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { sponsorAccountSchema, sponsorBrandSchema } from "@/components/auth/schema";
import BrandPanel from "@/components/auth/sponsor-sign-up/brand-panel";
import SignUpSteps from "@/components/auth/sponsor-sign-up/sign-up-steps";
import AccountStep from "@/components/auth/sponsor-sign-up/account-step";
import BrandStep from "@/components/auth/sponsor-sign-up/brand-step";
import ReviewStep from "@/components/auth/sponsor-sign-up/review-step";
import DoneStep from "@/components/auth/sponsor-sign-up/done-step";
import type { PickedLogo } from "@/components/auth/sponsor-sign-up/logo-upload";
import type { SignUpSetup } from "@/components/auth/sponsor-sign-up/load-sign-up-setup";
import {
  DONE_STEP,
  INITIAL_FORM,
  placeSignUpError,
  type SponsorSignUpForm,
} from "@/components/auth/sponsor-sign-up/data";
import type { SponsorSignupResult, SponsorTypeCode } from "@/utils/types/sponsor-profile";

const NAV_BUTTON = "h-[52px] rounded-[12px] text-base";

interface SponsorSignUpProps {
  // Loaded by the page on the server; null when the sign-up options couldn't be loaded.
  setup: SignUpSetup | null;
}

// Sponsor sign-up: Account → Brand → Review, then the "all set" screen. Nothing is sent until "Create
// sponsor account": the three steps go as one multipart request, which also signs the sponsor in.
export default function SponsorSignUp({ setup }: SponsorSignUpProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SponsorSignUpForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState<SponsorTypeCode>("LOCAL_BUSINESS");
  const [logo, setLogo] = useState<PickedLogo | null>(null);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Checked as soon as it's picked, so a wrong file never reaches Finish.
  async function pickLogo(file: File) {
    if (!setup) return;
    const problem = await checkLogo(file, setup.options.logo);
    if (problem) {
      setErrors((prev) => ({ ...prev, logo: problem }));
      return;
    }
    clearError("logo");
    setLogo({ file, url: URL.createObjectURL(file) });
  }

  // Our /api/auth/sponsor-signup route forwards the form and keeps the tokens in httpOnly cookies. A refusal
  // goes back to the step with the failing field, its message under it.
  async function createAccount() {
    const body = new FormData();
    body.append("name", form.contact.trim());
    body.append("email", form.email.trim());
    body.append("password", form.password);
    if (form.phone) body.append("phone", toE164Phone(form.phone));
    body.append("sponsorType", type);
    body.append("sponsorName", form.name.trim());
    body.append("category", form.category);
    body.append("acceptTerms", String(agree));
    if (logo) body.append("logo", logo.file);

    setSubmitting(true);
    try {
      const res = await fetch(routes.api.proxyAuthSponsorSignup, { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message: string = json?.message || "Couldn't create your account. Please try again.";
        const problem = placeSignUpError(res.status, message, Array.isArray(json?.data?.errors) ? json.data.errors : []);
        if (!problem) {
          toast.error(message);
          return;
        }
        setStep(problem.step);
        setErrors(problem.errors);
        return;
      }
      // For the sponsor header until /me answers in the sponsor panel.
      const result = json?.data?.[0] as SponsorSignupResult | undefined;
      if (result?.sponsor) setSponsorAccount(result.sponsor.account);
      goTo(DONE_STEP);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1 && !(await validateAndSetErrors(sponsorAccountSchema, form, setErrors))) return;
    if (step === 2 && !(await validateAndSetErrors(sponsorBrandSchema, form, setErrors))) return;
    if (step === 3) {
      if (agree && !submitting) await createAccount();
      return;
    }
    goTo(step + 1);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <BrandPanel />

      <main className="lg:flex-[1.3_1_520px] min-w-0 px-4 py-8 md:px-14 md:pt-12 md:pb-16 flex justify-center">
        <div ref={contentRef} className="w-full max-w-[640px] flex flex-col gap-7">
          {!setup ? (
            <section aria-label="Sign-up unavailable" className="flex flex-col gap-4 items-start pt-10">
              <h2 className="font-display font-black uppercase text-[32px] leading-none">Sign-up is unavailable</h2>
              <p className="text-[17px] text-[#d4d4d4] leading-[1.55]">
                We couldn’t load the sign-up form. Check your connection and try again.
              </p>
              <Button
                label="Try again"
                onClick={() => router.refresh()}
                className={cn(PRIMARY_BUTTON, NAV_BUTTON, "px-[26px]")}
              />
            </section>
          ) : step === DONE_STEP ? (
            <DoneStep contact={form.contact} brandName={form.name.trim()} />
          ) : (
            // POST, so a click before the page hydrates can't put the password in the URL (a form's default is GET).
            <form method="post" onSubmit={handleNext} noValidate className="flex flex-col gap-7">
              <SignUpSteps current={step} />

              {step === 1 && (
                <AccountStep
                  form={form}
                  errors={errors}
                  onField={setField}
                  onPhone={setPhone}
                  passwordRule={setup.options.password.rule}
                />
              )}
              {step === 2 && (
                <BrandStep
                  form={form}
                  errors={errors}
                  onField={setField}
                  options={setup.options}
                  type={type}
                  onType={setType}
                  logo={logo}
                  onPickLogo={pickLogo}
                  onRemoveLogo={() => setLogo(null)}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  form={form}
                  options={setup.options}
                  type={type}
                  logo={logo}
                  terms={setup.terms}
                  privacy={setup.privacy}
                  agree={agree}
                  onToggleAgree={() => {
                    setAgree((prev) => !prev);
                    clearError("acceptTerms");
                  }}
                  agreeError={errors.acceptTerms}
                  onEdit={goTo}
                />
              )}

              <div className="flex justify-between gap-3 flex-wrap border-t border-[#1f1f1f] pt-6">
                {step > 1 && (
                  <Button
                    label="Back"
                    onClick={() => goTo(step - 1)}
                    disabled={submitting}
                    className={cn(OUTLINE_BUTTON, NAV_BUTTON, "px-[22px] font-semibold")}
                  />
                )}
                <Button
                  type="submit"
                  label={step === 3 ? (submitting ? "Creating account…" : "Create sponsor account") : "Continue"}
                  disabled={step === 3 && (!agree || submitting)}
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
