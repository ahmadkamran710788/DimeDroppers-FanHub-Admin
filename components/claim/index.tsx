"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Building2 } from "lucide-react";

import Input from "@/components/common/input";
import Button from "@/components/common/button";
import SearchableSelect from "@/components/common/searchable-select";
import AuthCard from "@/components/auth/auth-card";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { DUMMY_ORGANIZATIONS } from "./data";
import { claimSchema } from "./schema";

interface ClaimForm {
  email: string;
  organizationId: string;
}

// The design's light fields on the dark card (same look as sign-in).
const LABEL = "text-white font-medium";
const FIELD = "bg-[#eef2fb] border-[#d6deef] rounded-[10px]";

export default function ClaimRegistration() {
  const router = useRouter();
  const [form, setForm] = useState<ClaimForm>({ email: "", organizationId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateAndSetErrors(claimSchema, form, setErrors))) return;

    setIsSubmitting(true);
    try {
      // TODO: call the backend here. For now this is UI only — simulate a short request and send the
      // user to the success screen. The real response decides between success and failure, e.g.:
      //   router.push(res.ok ? routes.ui.fanhubClaimSuccess : routes.ui.fanhubClaimFailure);
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.push(routes.ui.fanhubClaimSuccess);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard size="sm" aria-labelledby="claim-title">
      {/* noValidate: the errors show under the fields (the design's), not as the browser's bubbles. */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-2">
          <h1 id="claim-title" className="font-display font-black text-[40px] uppercase leading-none text-white">
            Claim your hub
          </h1>
          <p className="text-[#a1a1aa]">Enter your email and pick your organization to get started.</p>
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, email: e.target.value }));
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="you@organization.com"
          autoComplete="email"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email}
          labelClassName={LABEL}
          inputClassName={FIELD}
        />

        <SearchableSelect
          label="Organization"
          name="organizationId"
          value={form.organizationId}
          onChange={(value) => {
            setForm((prev) => ({ ...prev, organizationId: value }));
            if (errors.organizationId) setErrors((prev) => ({ ...prev, organizationId: "" }));
          }}
          options={DUMMY_ORGANIZATIONS}
          placeholder="Select your organization"
          searchPlaceholder="Search organizations"
          icon={<Building2 className="h-5 w-5" />}
          error={errors.organizationId}
          labelClassName={LABEL}
          selectClassName={FIELD}
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
    </AuthCard>
  );
}
