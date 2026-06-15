"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Building2 } from "lucide-react";

import Input from "@/components/common/Input";
import PhoneInput from "@/components/common/PhoneInput";
import Button from "@/components/common/Button";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { setFanhubSchoolId } from "@/utils/auth/session";
import type { AuthSession } from "@/utils/types/auth";
import { signUpSchema } from "../schema";

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
    try {
      // Same-origin proxy route (sets the httpOnly token cookies) — call it with a
      // plain fetch, not apiCall (apiCall prepends config.apiUrl for upstream calls).
      const res = await fetch(routes.api.proxyAuthSignup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        // e.g. 409 "An account with this email already exists".
        toast.error(json?.message || "Unable to create account. Please try again.");
        return;
      }

      // Signup creates the school row; org.id is its id (= JWT schoolId claim). Seed
      // it so Step 1 updates that school instead of creating a duplicate.
      const session = json?.data?.[0] as AuthSession | undefined;
      if (session?.organization?.id) {
        setFanhubSchoolId(String(session.organization.id));
      }

      router.replace(routes.ui.setupWizard.organizationDetails);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
