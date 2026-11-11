import { config } from "@/config";
import { apiRequest } from "@/utils/api-request";
import { routes } from "@/utils/routes";
import type { LegalDocument, SponsorSignupOptions } from "@/utils/types/sponsor-profile";

// The Terms of Use and Privacy Policy shown on a sign-up's Review step; each null when it couldn't be
// loaded (its modal then says so).
export interface LegalDocs {
  terms: LegalDocument | null;
  privacy: LegalDocument | null;
}

// A legal document is JSON under /api/v1/mobile, outside the API's open-CORS /api/v1/fanhub, so it's
// fetched on the server rather than from the browser. Its path is from the API host's root.
export async function loadLegal(path: string): Promise<LegalDocument | null> {
  try {
    const res = await fetch(new URL(path, config.apiUrl), { cache: "no-store" });
    const json = await res.json().catch(() => null);
    return res.ok ? ((json?.data?.[0] as LegalDocument | undefined) ?? null) : null;
  } catch {
    return null;
  }
}

// Both documents, for a sign-up that doesn't load the sponsor options itself (the organisation sign-up).
// Their paths come from the public sponsor sign-up options, the one place the API lists them.
export async function loadLegalDocs(): Promise<LegalDocs> {
  try {
    const json = await apiRequest({ endpoint: `/${routes.api.sponsorSignupOptions}` });
    const legal = (json?.data?.[0] as SponsorSignupOptions | undefined)?.legal;
    if (!legal) return { terms: null, privacy: null };
    const [terms, privacy] = await Promise.all([
      loadLegal(legal.termsOfUse.path),
      loadLegal(legal.privacyPolicy.path),
    ]);
    return { terms, privacy };
  } catch {
    return { terms: null, privacy: null };
  }
}
