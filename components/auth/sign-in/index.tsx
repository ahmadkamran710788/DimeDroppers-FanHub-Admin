"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";

import Input from "@/components/common/input";
import Button from "@/components/common/button";
import AuthCard, { AUTH_LINK } from "@/components/auth/auth-card";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { setFanhubSchoolId, setSponsorAccount } from "@/utils/auth/session";
import { getSavedSchool } from "@/utils/fanhub/get-saved-school";
import { getPostAuthRoute } from "@/utils/fanhub/get-resume-step";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/utils/types/auth";
import { signInSchema } from "../schema";

interface SignInForm {
  email: string;
  password: string;
}

// The design's light fields on the dark card.
const LABEL = "text-white font-medium";
const FIELD = "bg-[#eef2fb] border-[#d6deef] rounded-[10px]";

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

      // org.id is the school id (= JWT schoolId claim). Seed sessionStorage so Step 1
      // updates the auto-created school instead of creating a duplicate, and populate
      // the global AuthContext so the org is available app-wide without re-fetching.
      const session = json?.data?.[0] as AuthSession | undefined;
      // The same sign-in serves sponsors: they go to the sponsor panel. Full-page navigation, so the
      // sponsor panel starts without the organisation's client state.
      if (session?.role === "SPONSOR") {
        if (session.sponsor) setSponsorAccount(session.sponsor);
        window.location.replace(routes.ui.sponsor.sponsorships);
        return;
      }
      if (session?.organization?.id) {
        setFanhubSchoolId(String(session.organization.id));
        setAuth(session.organization);
      }

      const school = await getSavedSchool();
      router.replace(getPostAuthRoute(school));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard size="sm" aria-labelledby="sign-in-title">
      {/* noValidate: the errors show under the fields (the design's), not as the browser's bubbles. */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-2">
          <h1 id="sign-in-title" className="font-display font-black text-[40px] uppercase leading-none text-white">
            Sign in
          </h1>
          <p className="text-[#a1a1aa]">Welcome back. Sign in to manage your fan hub.</p>
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="you@organization.com"
          autoComplete="email"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email}
          labelClassName={LABEL}
          inputClassName={FIELD}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="Your password"
          autoComplete="current-password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password}
          labelClassName={LABEL}
          inputClassName={FIELD}
        />

        <Button
          type="submit"
          variant="cta"
          fullWidth
          disabled={isSubmitting}
          label={isSubmitting ? "Signing in…" : "Sign in"}
          className="h-[50px] rounded-[10px] text-[17px]"
        />

        <p className="text-center text-[#d4d4d8]">
          Don&apos;t have an account?{" "}
          <Link href={routes.ui.signUp} className={AUTH_LINK}>
            Create one
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
