"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { toE164Phone } from "@/utils/helper";
import { TEAM_NAME_KEY, setFanhubSchoolId } from "@/utils/auth/session";
import { validateAndSetErrors } from "@/utils/validation";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/utils/types/auth";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { sponsorRequest, type FieldError } from "@/components/sponsor/sponsor-api";
import { orgFormToFormData } from "@/components/organization/org-form/form";
import { orgAccountSchema, orgBrandingSchema, orgDetailsSchema, orgLocationSchema } from "@/components/auth/schema";
import BrandPanel from "@/components/auth/sign-up-shared/brand-panel";
import SignUpSteps from "@/components/auth/sign-up-shared/sign-up-steps";
import type { LegalDocs } from "@/components/auth/sign-up-shared/load-legal";
import AccountStep from "@/components/auth/organization-sign-up/account-step";
import OrganizationStep from "@/components/auth/organization-sign-up/organization-step";
import LocationStep from "@/components/auth/organization-sign-up/location-step";
import BrandingStep from "@/components/auth/organization-sign-up/branding-step";
import ReviewStep from "@/components/auth/organization-sign-up/review-step";
import DoneScreen from "@/components/auth/organization-sign-up/done-screen";
import {
  BRAND_PANEL,
  DONE_STEP,
  INITIAL_FORM,
  REVIEW_STEP,
  STEPS,
  logoProblem,
  placeSignUpError,
  type MapField,
  type OrgSignUpForm,
} from "@/components/auth/organization-sign-up/data";

const NAV_BUTTON = "h-[52px] rounded-[12px] text-base";

interface OrganizationSignUpProps {
  // Loaded by the page on the server; each null when it couldn't be loaded.
  legal: LegalDocs;
}

// Organisation sign-up: Account → Organization → Location → Branding → Review, then "Account created".
// Nothing is sent until "Create organization account": the account is created (which signs the organisation
// in), then the organisation's details are saved the way the Profile page saves them.
export default function OrganizationSignUp({ legal }: OrganizationSignUpProps) {
  const { setAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OrgSignUpForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Set once the account exists. If saving the details then fails, the button retries only that, and the
  // account step can't be changed any more.
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The step whose heading last had focus, so the first render doesn't steal it.
  const shownStep = useRef(step);

  // Each new step starts at its heading.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    if (step === DONE_STEP) document.getElementById("org-done-title")?.focus();
    else contentRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [step]);

  // The logo preview's object URL is let go when the logo changes or the page closes.
  useEffect(() => () => (logo ? URL.revokeObjectURL(logo.url) : undefined), [logo]);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const onValue = (field: keyof OrgSignUpForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const onField =
    (field: keyof OrgSignUpForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onValue(field)(e.target.value);

  // From the map: a picked address fills the address and the pin, a moved pin only the pin (whose errors share
  // "latitude", shown under the map).
  const onLocation = (fields: Partial<Pick<OrgSignUpForm, MapField>>) => {
    setForm((prev) => ({ ...prev, ...fields }));
    const cleared = [...Object.keys(fields), ...("latitude" in fields ? ["longitude"] : [])];
    setErrors((prev) =>
      cleared.some((f) => prev[f]) ? { ...prev, ...Object.fromEntries(cleared.map((f) => [f, ""])) } : prev
    );
  };

  async function pickLogo(file: File) {
    const problem = await logoProblem(file);
    if (problem) {
      setErrors((prev) => ({ ...prev, logo: problem }));
      return;
    }
    setLogo({ file, url: URL.createObjectURL(file) });
    clearError("logo");
  }

  const goTo = (next: number) => {
    setErrors({});
    setStep(next);
  };

  // A refusal goes back to the step with the failing field, its message under it; otherwise a toast.
  function showProblem(status: number, message: string, fieldErrors: FieldError[], prefix = "") {
    const problem = placeSignUpError(status, message, fieldErrors);
    if (!problem) {
      toast.error(prefix + message);
      return;
    }
    if (prefix) toast.error(`${prefix}fix the highlighted field and save again.`);
    setStep(problem.step);
    setErrors(problem.errors);
  }

  async function createAccount() {
    setSubmitting(true);
    try {
      let id = schoolId;
      if (!id) {
        // Our /api/auth/signup route keeps the tokens in httpOnly cookies, which signs the organisation in.
        const res = await fetch(routes.api.proxyAuthSignup, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.organizationName.trim(),
            email: form.accountEmail.trim(),
            password: form.password,
            ...(form.accountPhone && { phone: toE164Phone(form.accountPhone) }),
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const message: string = json?.message || "Couldn't create your account. Please try again.";
          showProblem(res.status, message, Array.isArray(json?.data?.errors) ? json.data.errors : []);
          return;
        }
        const organization = (json?.data?.[0] as AuthSession | undefined)?.organization;
        if (!organization?.id) {
          toast.error("Your account was created, but we couldn't sign you in. Sign in to finish setting up.");
          return;
        }
        id = String(organization.id);
        // The organisation's id is the school every org endpoint is scoped to.
        setFanhubSchoolId(id);
        setAuth(organization);
        setSchoolId(id);
      }

      // Sign-up made the organisation with its name only; the rest goes in as the Profile page sends it.
      const body = orgFormToFormData({ ...form, organizationName: form.organizationName.trim() }, logo?.file ?? null);
      // The API doesn't keep these on an organisation yet (gender is on teams only, and the map pin isn't
      // taken); sent so they're stored once it does.
      body.append("gender", form.gender);
      body.append("latitude", form.latitude.trim());
      body.append("longitude", form.longitude.trim());
      const saved = await sponsorRequest("PUT", routes.api.updateSchool(id), { body });
      if (saved.status < 200 || saved.status >= 300) {
        showProblem(
          saved.status,
          saved.message ?? "Please try again.",
          saved.errors ?? [],
          "Your account is created, but your organization details weren't saved: "
        );
        return;
      }
      if (form.teamName.trim()) sessionStorage.setItem(TEAM_NAME_KEY, form.teamName.trim());
      goTo(DONE_STEP);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!(await validateAndSetErrors(orgAccountSchema, form, setErrors))) return;
      // The contact on step 3 starts as this person (each field only while it's empty).
      setForm((prev) => ({
        ...prev,
        contactName: prev.contactName || prev.fullName.trim(),
        email: prev.email || prev.accountEmail.trim(),
        phone: prev.phone || prev.accountPhone,
      }));
    }
    if (step === 2) {
      // An empty team name takes the organisation's.
      const values = form.teamName.trim() ? form : { ...form, teamName: form.organizationName.trim() };
      setForm(values);
      if (!(await validateAndSetErrors(orgDetailsSchema, values, setErrors))) return;
    }
    if (step === 3 && !(await validateAndSetErrors(orgLocationSchema, form, setErrors))) return;
    if (step === 4 && !(await validateAndSetErrors(orgBrandingSchema, form, setErrors))) return;
    if (step === REVIEW_STEP) {
      if (!agree) setErrors({ acceptTerms: "Please accept the terms to create your account." });
      else if (!submitting) await createAccount();
      return;
    }
    goTo(step + 1);
  }

  if (step === DONE_STEP) {
    return <DoneScreen fullName={form.fullName} organizationName={form.organizationName.trim()} />;
  }

  // Once the account exists, its step is done for good.
  const firstStep = schoolId ? 2 : 1;
  const hasErrors = step < REVIEW_STEP && Object.values(errors).some(Boolean);
  const primaryLabel =
    step < REVIEW_STEP
      ? "Continue"
      : submitting
        ? schoolId
          ? "Saving…"
          : "Creating account…"
        : schoolId
          ? "Save organization details"
          : "Create organization account";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <BrandPanel {...BRAND_PANEL} />

      <main className="lg:flex-[1.35_1_520px] min-w-0 px-4 py-8 md:px-14 md:pt-12 md:pb-16 flex justify-center">
        <div ref={contentRef} className="w-full max-w-[760px] flex flex-col gap-7">
          {/* POST, so a click before the page hydrates can't put the password in the URL (a form's default is GET). */}
          <form method="post" onSubmit={handleNext} noValidate className="flex flex-col gap-7">
            <SignUpSteps steps={STEPS} current={step} />

            {step === 1 && <AccountStep form={form} errors={errors} onField={onField} onValue={onValue} />}
            {step === 2 && <OrganizationStep form={form} errors={errors} onField={onField} onValue={onValue} />}
            {step === 3 && (
              <LocationStep form={form} errors={errors} onField={onField} onValue={onValue} onLocation={onLocation} />
            )}
            {step === 4 && (
              <BrandingStep
                form={form}
                errors={errors}
                onField={onField}
                onValue={onValue}
                logo={logo}
                onLogo={pickLogo}
                onRemoveLogo={() => setLogo(null)}
              />
            )}
            {step === REVIEW_STEP && (
              <ReviewStep
                form={form}
                logoName={logo?.file.name ?? null}
                accountCreated={!!schoolId}
                terms={legal.terms}
                privacy={legal.privacy}
                agree={agree}
                onToggleAgree={() => {
                  setAgree((prev) => !prev);
                  clearError("acceptTerms");
                }}
                agreeError={errors.acceptTerms}
                onEdit={goTo}
              />
            )}

            <div className="flex justify-between items-center gap-3 flex-wrap border-t border-[#1f1f1f] pt-6">
              {step === 1 ? (
                <Link
                  href={routes.ui.signUp}
                  className={cn(OUTLINE_BUTTON, NAV_BUTTON, "inline-flex items-center px-[22px] font-semibold hover:bg-white/5")}
                >
                  ← Account type
                </Link>
              ) : step > firstStep ? (
                <Button
                  label="← Back"
                  onClick={() => goTo(step - 1)}
                  disabled={submitting}
                  className={cn(OUTLINE_BUTTON, NAV_BUTTON, "px-[22px] font-semibold")}
                />
              ) : (
                <span />
              )}
              <div className="flex items-center gap-4 ml-auto">
                {hasErrors && (
                  <span role="alert" className="text-[13px] text-error">
                    Fix the highlighted fields.
                  </span>
                )}
                <Button
                  type="submit"
                  label={primaryLabel}
                  disabled={submitting}
                  className={cn(PRIMARY_BUTTON, NAV_BUTTON, "px-[26px] disabled:opacity-100 disabled:bg-[#3a3450] disabled:text-[#bdb6d6]")}
                />
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
