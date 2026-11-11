import type { Metadata } from "next";
import { connection } from "next/server";
import OrganizationSignUp from "@/components/auth/organization-sign-up";
import { loadLegalDocs } from "@/components/auth/sign-up-shared/load-legal";

export const metadata: Metadata = {
  title: "Dime Fan Hub · Sign up",
};

export default async function OrganizationSignUpPage() {
  // The legal documents are loaded per request, never baked in at build time (the loader catches its own
  // failures, so it must not run during prerendering).
  await connection();
  return <OrganizationSignUp legal={await loadLegalDocs()} />;
}
