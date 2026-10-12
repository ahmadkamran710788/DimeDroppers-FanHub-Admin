// Shapes returned by the FanHub Org Auth API (data[0] of the response envelope).

export interface AuthOrganization {
  id: string;
  name: string;
  email: string;
  phone: string;
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

// signin / signup payload — includes the organization.
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  organization: AuthOrganization;
}

// refresh payload — tokens only.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
