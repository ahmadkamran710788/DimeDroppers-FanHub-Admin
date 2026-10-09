"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Building2 } from "lucide-react";

import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import Button from "@/components/common/button";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { markSignedIn, setFanhubSchoolId } from "@/utils/auth/session";
import { getSavedSchool } from "@/utils/fanhub/get-saved-school";
import { getPostAuthRoute } from "@/utils/fanhub/get-resume-step";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/utils/types/auth";
import { signUpSchema } from "@/components/auth/schema";

interface SignUpForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: SignUpForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function SignUp() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState<SignUpForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: keyof SignUpForm) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleChange =
    (field: keyof SignUpForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    };

  const handlePhoneChange = (value: string) => {
    setForm((prev) => ({ ...prev, phone: value }));
    clearError("phone");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateAndSetErrors(signUpSchema, form, setErrors))) return;

    setIsSubmitting(true);
    // Straight to the backend, which sets the httpOnly token cookies on success.
    // apiCall shows the error toast (e.g. 409 "An account with this email already exists").
    const { success, data } = await apiCall<{ data: AuthSession[] }>({
      endpoint: routes.api.authSignup,
      method: "POST",
      data: { name: form.name, email: form.email, phone: form.phone, password: form.password },
      skipAuthRefresh: true,
    });

    if (!success) {
      setIsSubmitting(false);
      return;
    }
    markSignedIn();

    // Signup creates the school row; org.id is its id (= JWT schoolId claim). Seed
    // sessionStorage so Step 1 updates that school instead of creating a duplicate,
    // and populate global AuthContext so the org is available app-wide.
    const session = data?.data?.[0];
    if (session?.organization?.id) {
      setFanhubSchoolId(String(session.organization.id));
      setAuth(session.organization);
    }

    const school = await getSavedSchool();
    setIsSubmitting(false);
    router.replace(getPostAuthRoute(school));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-black text-[32px] uppercase leading-none text-white">
          Create account
        </h1>
        <p className="text-sm text-white/70">
          Set up your organization to launch your fan hub.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Organization name"
          name="name"
          value={form.name}
          onChange={handleChange("name")}
          placeholder="Twin Lakes Academy"
          icon={<Building2 className="h-5 w-5" />}
          error={errors.name}
          labelClassName="text-white"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="you@organization.com"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email}
          labelClassName="text-white"
        />
        <PhoneInput
          label="Phone"
          name="phone"
          value={form.phone}
          onValueChange={handlePhoneChange}
          error={errors.phone}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="At least 6 characters"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password}
          labelClassName="text-white"
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Re-enter your password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword}
          labelClassName="text-white"
        />
      </div>

      <Button
        type="submit"
        variant="cta"
        fullWidth
        disabled={isSubmitting}
        label={isSubmitting ? "Creating account…" : "Create account"}
      />

      <p className="text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href={routes.ui.signIn} className="font-medium text-steel-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
