// Shapes returned by the FanHub Org Auth API (data[0] of the response envelope).

import type { SponsorBrandProfile } from "@/utils/types/sponsor-profile";

// The login account's role. The one sign-in serves both: ORGANISER → the organisation panel (school or
// tournament by organizationType), SPONSOR → the sponsor panel.
export type AccountRole = "ORGANISER" | "SPONSOR";

export interface AuthOrganization {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: AccountRole | null;
}

// A sponsor's account, from sign-in.
export interface SponsorAccount {
  id: string;
  name: string | null;
  email: string;
  role: "SPONSOR";
  phone: string | null;
}

// The brand of the sponsor's DAN membership (the older sponsor record).
export interface SponsorDanBrand {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
}

// GET /fanhub/org-auth/me for a sponsor token: data[0].sponsor.
export interface SponsorProfile extends SponsorAccount {
  lastLoginAt: string | null;
  createdAt: string;
  // The Fan Hub brand profile, as on GET /fanhub/sponsor-profile (logoUrl signed for an hour); null when the
  // sponsor has no brand yet.
  brand: SponsorBrandProfile | null;
  // null without a DAN membership.
  danBrand: SponsorDanBrand | null;
}

// GET /fanhub/org-auth/me — the full profile behind the access token (data[0].organization).
// `logoUrl` is presigned for one hour; `timezone` is an IANA name.
export interface OrganizationProfile extends AuthOrganization {
  logoUrl: string | null;
  level: string | null;
  organizationType: string | null;
  mascot: string | null;
  colors: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  website: string | null;
  description: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPosition: string | null;
  social: {
    facebookUrl: string | null;
    instagramUrl: string | null;
    xUrl: string | null;
    youtubeUrl: string | null;
    tiktokUrl: string | null;
  };
  counts: { teams: number; followers: number };
  createdAt: string;
}

// signin / signup payload: an organiser gets `organization`, a sponsor `sponsor`. Sign-up and an older
// backend send no `role` (an organiser).
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  role?: AccountRole;
  organization?: AuthOrganization;
  sponsor?: SponsorAccount;
}

// refresh payload — tokens only.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
