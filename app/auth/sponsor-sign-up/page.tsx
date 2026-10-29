import type { Metadata } from "next";
import { connection } from "next/server";
import SponsorSignUp from "@/components/auth/sponsor-sign-up";
import { loadSignUpSetup } from "@/components/auth/sponsor-sign-up/load-sign-up-setup";

export const metadata: Metadata = {
  title: "Dime Sponsors · Sign up",
};

export default async function SponsorSignUpPage() {
  // The options and legal documents are loaded per request, never baked in at build time (the loader
  // catches its own failures, so it must not run during prerendering).
  await connection();
  return <SponsorSignUp setup={await loadSignUpSetup()} />;
}
