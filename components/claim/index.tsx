"use client";

import { useState } from "react";

import AuthCard from "@/components/auth/auth-card";
import OrganizationStep from "./organization-step";
import EmailStep from "./email-step";
import type { ClaimOrganization } from "./data";

// Two-step claim wizard. Step 1 picks an organization from the list (Claim button); step 2 collects the
// email for the chosen organization and submits. Keeping the selected org here lets step 2 show it and
// Back return to the list.
export default function ClaimRegistration() {
  const [organization, setOrganization] = useState<ClaimOrganization | null>(null);

  return (
    <AuthCard size="sm">
      {organization ? (
        <EmailStep organization={organization} onBack={() => setOrganization(null)} />
      ) : (
        <OrganizationStep onClaim={setOrganization} />
      )}
    </AuthCard>
  );
}
