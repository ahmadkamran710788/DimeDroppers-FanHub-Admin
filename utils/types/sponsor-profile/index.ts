// Sponsor sign-up and profile: /fanhub/sponsor-auth/* (no token) and /fanhub/sponsor-profile/* (sponsor token),
// FANHUB_SPONSOR_SIGNUP_PROFILE_FRONTEND.md and FANHUB_SPONSOR_LOCATION_FETCH_FRONTEND.md. Shapes of data[0] of
// the response envelope.

export type SponsorTypeCode = "LOCAL_BUSINESS" | "REGIONAL_BRAND" | "NATIONAL_BRAND";
export type SponsorLocationSource = "MANUAL" | "AI";
export type SponsorLocationFetchStatus = "PENDING" | "RUNNING" | "SAVING" | "COMPLETED" | "FAILED";
// MAIN_CITY: a local business, searched in its main location's city (a button only). SELECTED_AREAS: a regional
// or national brand, searched in the states, cities and ZIP codes it picks.
export type SponsorLocationFetchMode = "MAIN_CITY" | "SELECTED_AREAS";

export interface LogoRules {
  // false: the logo is optional on sign-up.
  required?: boolean;
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
  // The main (headquarters) location: exactly one has it. It can't be removed, only replaced by another.
  isMain: boolean;
  // The fetch that found this store; null for one the sponsor added.
  fetchRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

// A state, city or ZIP code a fetch searched (FANHUB_SPONSOR_LOCATION_FETCH_ZIP_FRONTEND.md).
export interface SponsorFetchArea {
  // Stable id, e.g. "STATE:OK", "CITY:TX:houston" or "ZIP:33801"; sent back as ?areaKey=.
  key: string;
  kind: "STATE" | "CITY" | "ZIP";
  // Two-letter code. "" (and stateName "", city null) for a ZIP code until the fetch has placed it on the map,
  // a second or two after it starts.
  state: string;
  stateName: string;
  // null for a state.
  city: string | null;
  // The ZIP code of a ZIP area; null for a state or city (and on every area of fetches before 13 Nov 2026).
  zipCode: string | null;
  // Ready to show: "Oklahoma", "Houston, TX", "33801 (Lakeland, FL)" ("33801" until it is placed).
  label: string;
  // "Not found on the map" when Google couldn't place it; the other areas are still searched.
  error: string | null;
}

// The profile's view of the latest location fetch; status null before the first one.
export interface SponsorLocationFetch {
  mode: SponsorLocationFetchMode;
  // A main location and no fetch running: the Fetch button is enabled on this.
  canFetch: boolean;
  runId: string | null;
  status: SponsorLocationFetchStatus | null;
  areas: SponsorFetchArea[];
  startedAt: string | null;
  completedAt: string | null;
  // A note on the latest fetch (e.g. "No locations of this brand were found in the chosen areas"), or null.
  error: string | null;
}

// POST /locations/fetch, and each of GET /locations/fetches.
export interface SponsorLocationFetchRun {
  id: string;
  status: SponsorLocationFetchStatus;
  areas: SponsorFetchArea[];
  // New stores this fetch found / saved.
  foundCount: number;
  savedCount: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// One area of a fetch with all of the sponsor's locations in it: the ones it added and any saved before.
export interface SponsorFetchAreaResult {
  area: SponsorFetchArea;
  locationCount: number;
  // Added by this fetch.
  newCount: number;
  locations: SponsorLocation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// GET /locations/fetches/:runId.
export interface SponsorLocationFetchResult extends SponsorLocationFetchRun {
  results: SponsorFetchAreaResult[];
}

// POST /locations/fetch for a regional or national brand: at least one state, city or ZIP code (a local
// business sends nothing). States and cities' states as codes or names; ZIP codes as 5-digit strings (ZIP+4 is
// cut to 5), no state needed.
export interface StartLocationFetchBody {
  states?: string[];
  cities?: { city: string; state: string }[];
  zipCodes?: string[];
}

// GET / PATCH /fanhub/sponsor-profile.
export interface SponsorProfileView {
  account: SponsorProfileAccount;
  // null only for an account with no brand profile yet: saving one with a sponsorName creates it.
  brand: SponsorBrandProfile | null;
  consent: { termsVersion: string | null; privacyVersion: string | null; acceptedAt: string | null };
  // The main location; null for an older account with no locations yet (the first one added becomes main).
  mainLocation: SponsorLocation | null;
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
  // Makes it the main location (the previous main becomes a plain one).
  isMain?: true;
}

// DELETE a location.
export interface RemovedSponsorLocation {
  id: string;
}
