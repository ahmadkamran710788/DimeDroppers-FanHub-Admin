// Sponsor sign-up and profile: /fanhub/sponsor-auth/* (no token) and /fanhub/sponsor-profile/* (sponsor token),
// FANHUB_SPONSOR_SIGNUP_PROFILE_FRONTEND.md. Shapes of data[0] of the response envelope.

export type SponsorTypeCode = "LOCAL_BUSINESS" | "REGIONAL_BRAND" | "NATIONAL_BRAND";
export type SponsorLocationSource = "MANUAL" | "AI";
export type SponsorLocationFetchStatus = "PENDING" | "RUNNING" | "SAVING" | "COMPLETED" | "FAILED";

export interface LogoRules {
  types: string[];
  minWidth: number;
  minHeight: number;
  maxBytes: number;
}

export interface SponsorTypeOption {
  code: SponsorTypeCode;
  label: string;
  description: string;
}

export interface LegalDocumentRef {
  version: string;
  effectiveDate: string;
  // From the API host's root ("/api/v1/mobile/fanhub/legal/terms-of-use"), not from config.apiUrl.
  path: string;
}

// GET /fanhub/sponsor-auth/options.
export interface SponsorSignupOptions {
  sponsorTypes: SponsorTypeOption[];
  // `code` is sent, `label` shown (today they are the same text).
  categories: { code: string; label: string }[];
  password: { minLength: number; requiresNumber: boolean; rule: string };
  logo: LogoRules;
  legal: { termsOfUse: LegalDocumentRef; privacyPolicy: LegalDocumentRef };
}

// GET /api/v1/mobile/fanhub/legal/{terms-of-use|privacy-policy}: the document itself, as JSON.
export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
  subsections?: LegalSection[];
}

export interface LegalDocument {
  key: string;
  title: string;
  version: string;
  effectiveDate: string;
  sections: LegalSection[];
}

// The person who signed up.
export interface SponsorProfileAccount {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "SPONSOR";
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SponsorBrandProfile {
  id: string;
  sponsorType: SponsorTypeCode;
  sponsorTypeLabel: string;
  name: string;
  // null for some older sponsor accounts: they pick one on the profile.
  category: string | null;
  // Signed for one hour and re-signed on every GET; never stored.
  logoUrl: string | null;
}

export interface SponsorLocation {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  source: SponsorLocationSource;
  // The store's Google Maps link for an AI location; null for a manual one.
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// The one-time automatic store lookup; status null when it never ran (older accounts).
export interface SponsorLocationFetch {
  status: SponsorLocationFetchStatus | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

// GET / PATCH /fanhub/sponsor-profile.
export interface SponsorProfileView {
  account: SponsorProfileAccount;
  // null only for an account with no brand profile yet: saving one with a sponsorName creates it.
  brand: SponsorBrandProfile | null;
  consent: { termsVersion: string | null; privacyVersion: string | null; acceptedAt: string | null };
  // Oldest first.
  locations: SponsorLocation[];
  locationsFetchedAt: string | null;
  locationsFetch: SponsorLocationFetch;
}

// POST /fanhub/sponsor-auth/signup, as our /api/auth/sponsor-signup route hands it on (no refresh token).
export interface SponsorSignupResult {
  accessToken: string;
  role: "SPONSOR";
  sponsor: SponsorProfileView;
}

// PATCH /fanhub/sponsor-profile as JSON; only what changed. `phone: null` removes it.
export interface SponsorProfileUpdate {
  name?: string;
  phone?: string | null;
  sponsorType?: SponsorTypeCode;
  sponsorName?: string;
  category?: string;
  removeLogo?: boolean;
}

// POST / PATCH a location; only what changed on PATCH, null clears a text field.
export interface SponsorLocationInput {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  latitude?: number;
  longitude?: number;
}

// DELETE a location.
export interface RemovedSponsorLocation {
  id: string;
}
