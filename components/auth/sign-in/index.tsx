"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";

import Input from "@/components/common/input";
import Button from "@/components/common/button";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { markSignedIn, setFanhubSchoolId } from "@/utils/auth/session";
import { getSavedSchool } from "@/utils/fanhub/get-saved-school";
import { getPostAuthRoute } from "@/utils/fanhub/get-resume-step";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/utils/types/auth";
import { signInSchema } from "@/components/auth/schema";

interface SignInForm {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState<SignInForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof SignInForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateAndSetErrors(signInSchema, form, setErrors))) return;

    setIsSubmitting(true);
    // Straight to the backend, which sets the httpOnly token cookies on success.
    // apiCall shows the error toast (e.g. 401 "Invalid email or password").
    const { success, data } = await apiCall<{ data: AuthSession[] }>({
      endpoint: routes.api.authSignin,
      method: "POST",
      data: { email: form.email, password: form.password },
      // The backend's JSON body parser expects plain JSON, not apiCall's ld+json default.
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      skipAuthRefresh: true,
    });

    if (!success) {
      setIsSubmitting(false);
      return;
    }
    markSignedIn();

    // org.id is the school id (= JWT schoolId claim). Seed sessionStorage so Step 1
    // updates the auto-created school instead of creating a duplicate, and populate
    // the global AuthContext so the org is available app-wide without re-fetching.
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
          Sign in
        </h1>
        <p className="text-sm text-white/70">
          Welcome back. Sign in to manage your fan hub.
        </p>
      </div>

      <div className="flex flex-col gap-4">
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
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="Enter your password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password}
          labelClassName="text-white"
        />
      </div>

      <Button
        type="submit"
        variant="cta"
        fullWidth
        disabled={isSubmitting}
        label={isSubmitting ? "Signing in…" : "Sign in"}
      />

      <p className="text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link href={routes.ui.signUp} className="font-medium text-steel-blue hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
