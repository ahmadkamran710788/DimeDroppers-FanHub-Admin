import { config } from "@/config";
import { apiRequest } from "@/utils/api-request";
import { routes } from "@/utils/routes";
import type { LegalDocument, SponsorSignupOptions } from "@/utils/types/sponsor-profile";

// What the sign-up wizard needs before it opens, loaded by its page on the server.
export interface SignUpSetup {
  options: SponsorSignupOptions;
  // Each null when it couldn't be loaded; its modal then says so.
  terms: LegalDocument | null;
  privacy: LegalDocument | null;
}

// A legal document is JSON under /api/v1/mobile, outside the API's open-CORS /api/v1/fanhub, so it's
// fetched here rather than from the browser. Its path is from the API host's root.
async function loadLegal(path: string): Promise<LegalDocument | null> {
  try {
    const res = await fetch(new URL(path, config.apiUrl), { cache: "no-store" });
    const json = await res.json().catch(() => null);
    return res.ok ? ((json?.data?.[0] as LegalDocument | undefined) ?? null) : null;
  } catch {
    return null;
  }
}

// The sponsor types, categories, password and logo rules, and both legal documents; null when the
// options can't be loaded (the wizard can't be filled in without them).
export async function loadSignUpSetup(): Promise<SignUpSetup | null> {
  try {
    const json = await apiRequest({ endpoint: `/${routes.api.sponsorSignupOptions}` });
    const options = json?.data?.[0] as SponsorSignupOptions | undefined;
    if (!options) return null;
    const [terms, privacy] = await Promise.all([
      loadLegal(options.legal.termsOfUse.path),
      loadLegal(options.legal.privacyPolicy.path),
    ]);
    return { options, terms, privacy };
  } catch {
    return null;
  }
}
