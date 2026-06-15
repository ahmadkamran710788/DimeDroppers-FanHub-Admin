"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { setFanhubSchoolId } from "@/utils/auth/session";
import type { AuthSession } from "@/utils/types/auth";
import { signInSchema } from "../schema";

interface SignInForm {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
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
    try {
      // Same-origin proxy route (sets the httpOnly token cookies) — call it with a
      // plain fetch, not apiCall (apiCall prepends config.apiUrl for upstream calls).
      const res = await fetch(routes.api.proxyAuthSignin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        // e.g. 401 "Invalid email or password" — surfaced from the backend message.
        toast.error(json?.message || "Unable to sign in. Please try again.");
        return;
      }

      // org.id is the school id (= JWT schoolId claim). Seed it so Step 1 updates
      // the auto-created school instead of creating a duplicate.
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
