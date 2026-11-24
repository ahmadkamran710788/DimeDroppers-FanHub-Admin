"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ChevronLeft, BriefcaseBusiness } from "lucide-react";

import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Button from "@/components/common/button";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { claimDetailsSchema } from "../schema";
import type { ClaimOrganization } from "../data";

interface EmailStepProps {
  organization: ClaimOrganization;
  // Back to step 1 (the organization list).
  onBack: () => void;
}

const LABEL = "text-white font-medium";
const FIELD = "bg-[#eef2fb] border-[#d6deef] rounded-[10px]";

// The claimer's role at the organization. `value` is sent to the backend; `label` is shown.
const TITLE_OPTIONS = [
  { label: "Founder", value: "Founder" },
  { label: "Co-Founder", value: "Co-Founder" },
  { label: "CEO", value: "CEO" },
  { label: "President", value: "President" },
  { label: "Owner", value: "Owner" },
  { label: "Executive Director", value: "Executive Director" },
  { label: "Director", value: "Director" },
  { label: "Principal", value: "Principal" },
  { label: "Athletic Director", value: "Athletic Director" },
  { label: "Coach", value: "Coach" },
  { label: "Administrator", value: "Administrator" },
  { label: "Other", value: "Other" },
];

// Step 2 — the picked organization is shown at the top; the user picks their title, enters their email
// and submits.
export default function EmailStep({ organization, onBack }: EmailStepProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateAndSetErrors(claimDetailsSchema, { title, email }, setErrors))) return;

    setIsSubmitting(true);
    try {
      // TODO: call the backend here with { organizationId: organization.id, title, email }. UI only for
      // now — simulate a short request, then the real response decides between success and failure, e.g.:
      //   router.push(res.ok ? routes.ui.fanhubClaimSuccess : routes.ui.fanhubClaimFailure);
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.push(routes.ui.fanhubClaimSuccess);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <Button
          variant="text"
          size="sm"
          label="Back"
          icon={<ChevronLeft className="h-4 w-4" />}
          onClick={onBack}
          className="w-fit gap-1 px-0 text-white/60 hover:text-white"
        />
        <p className="text-sm font-medium text-white/50">Step 2 of 2</p>
        <h1 className="font-display font-black text-[40px] uppercase leading-none text-white">Your email</h1>
        <p className="text-[#a1a1aa]">Enter your email to finish claiming this organization.</p>
      </div>

      {/* The organization chosen in step 1. */}
      <div className="rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-white/45">Claiming</p>
        <p className="mt-1 text-base font-semibold text-white">{organization.name}</p>
        <p className="text-sm text-white/55">{organization.location}</p>
      </div>

      {/* noValidate: the errors show under the field (the design's), not as the browser's bubbles. */}
      <form onSubmit={handleSubmit} noValidate suppressHydrationWarning className="flex flex-col gap-[22px]">
        <Select
          label="Title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
          }}
          options={TITLE_OPTIONS}
          placeholder="Select your title"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          error={errors.title}
          labelClassName={LABEL}
          selectClassName={FIELD}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="you@organization.com"
          autoComplete="email"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email}
          labelClassName={LABEL}
          inputClassName={FIELD}
        />

        <Button
          type="submit"
          variant="cta"
          fullWidth
          disabled={isSubmitting}
          label={isSubmitting ? "Submitting…" : "Submit"}
          className="h-[50px] rounded-[10px] text-[17px]"
        />
      </form>
    </div>
  );
}
